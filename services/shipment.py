from uuid import UUID
from typing import TYPE_CHECKING
from hmac import compare_digest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from Database.redis import clear_otp, verify_otp
from services.Base import BaseService
from schemas.shipment import Shipment, ShipmentCreate, ShipmentStatus, ShipmentUpdate
from services.DeliveryPartner import DeliveryPartnerService
from services.ShipmentEvent import ShipmentEventService
from core.exception import (
    BadRequest,
    ClientNotAuthorized,
    EntityNotFound,
    InvalidToken,
)

from utils import REVIEW_LINK_EXPIRY, decode_url_safe_token

from schemas.Review import Review
from schemas.Tag import Tag, TagName

if TYPE_CHECKING:
    from schemas.DeliveryPartner import DeliveryPartner
    from schemas.seller import Seller


class ShipmentService(BaseService):
    def __init__(
        self,
        session: AsyncSession,
        partner_service: DeliveryPartnerService,
        event_service: ShipmentEventService,
    ):
        super().__init__(Shipment, session)
        self.partner_service = partner_service
        self.event_service = event_service

    async def get(self, id: UUID) -> Shipment | None:
        shipment = await self._get(id)
        if not shipment:
            raise EntityNotFound()
        return shipment

    async def add(self, shipment_create: ShipmentCreate, seller: "Seller") -> Shipment:
        new_shipment = Shipment(
            **shipment_create.model_dump(),
            status=ShipmentStatus.placed,
            # Must be tz-aware; a naive datetime gets misread as UTC by Postgres.
            estimated_delivery=datetime.now(tz=timezone.utc) + timedelta(days=3),
            seller_id=seller.id,
        )
        partner = await self.partner_service.assign_shipment(new_shipment)
        new_shipment.delivery_partner_id = partner.id
        shipment = await self._add(new_shipment)
        await self.event_service.add(
            shipment=shipment,
            location=seller.zipcode or shipment_create.destination,
            status=ShipmentStatus.placed,
            description=f"Your order is assigned to {partner.name}",
        )
        return shipment

    async def update(
        self, id: UUID, shipment_update: ShipmentUpdate, partner: "DeliveryPartner"
    ) -> Shipment | None:
        shipment = await self.get(id)

        if shipment.delivery_partner_id != partner.id:
            raise ClientNotAuthorized()
        if shipment_update.status == ShipmentStatus.delivered:
            code = await verify_otp(shipment.id)
            # No stored code (never dispatched, or expired) - refuse rather than
            # let a caller match it by literally sending "None".
            if code is None:
                raise ClientNotAuthorized(
                    "No verification code is active for this shipment"
                )
            if not compare_digest(code, shipment_update.verification_code or ""):
                raise ClientNotAuthorized("Verification code is incorrect")
            # One code, one delivery.
            await clear_otp(shipment.id)
        # estimated_delivery lives on the shipment row, not the event; applied separately.
        if shipment_update.estimated_delivery:
            shipment.estimated_delivery = shipment_update.estimated_delivery

        event_fields = shipment_update.model_dump(
            exclude_none=True, exclude={"verification_code", "estimated_delivery"}
        )
        if event_fields:
            await self.event_service.add(shipment=shipment, **event_fields)
        return await self._update(shipment)

    def validate_review_token(self, token: str) -> dict:
        token_data = decode_url_safe_token(token, expiry=REVIEW_LINK_EXPIRY)
        if not token_data:
            raise InvalidToken("Invalid or expired review link")
        return token_data

    async def rate(self, token: str, rating: int, comment: str | None = None):
        token_data = self.validate_review_token(token)
        shipment = await self.get(UUID(token_data["id"]))
        # One review per shipment; the link stays valid and reusable otherwise.
        if shipment.review is not None:
            raise BadRequest("This shipment has already been reviewed")
        new_review = Review(
            rating=rating,
            feedback=comment if comment else None,
            shipment_id=shipment.id,
        )
        self.session.add(new_review)
        await self.session.commit()

    async def cancel(self, id: UUID, seller: "Seller") -> Shipment:
        shipment = await self._get_owned(id, seller)
        # A parcel already handed over cannot be un-delivered, and cancelling
        # twice sends the buyer a second cancellation email for an order that
        # was already cancelled.
        if shipment.status in (ShipmentStatus.delivered, ShipmentStatus.cancelled):
            raise BadRequest(f"Shipment is already {shipment.status.value}")
        event = await self.event_service.add(
            shipment=shipment, status=ShipmentStatus.cancelled
        )
        shipment.timeline.append(event)
        return shipment

    async def delete(self, id: UUID) -> None:
        await self._delete(await self.get(id))

    async def _get_tag(self, tag_name: TagName) -> "Tag":
        """Tag row for this name, or 404 instead of a None nobody checks."""
        tag = await tag_name.tag(self.session)
        if tag is None:
            raise EntityNotFound(f"Tag {tag_name.value} does not exist")
        return tag

    async def _get_owned(self, id: UUID, seller: "Seller") -> Shipment:
        """Shipment owned by this seller. 404s (not 401) to avoid confirming
        other sellers' shipment ids exist."""
        shipment = await self.get(id)
        if shipment.seller_id != seller.id:
            raise EntityNotFound("ID NOT FOUND")
        return shipment

    async def add_tag(self, id: UUID, tag_name: TagName, seller: "Seller"):
        shipment = await self._get_owned(id, seller)
        tag = await self._get_tag(tag_name)
        # Adding the same tag twice violates the shipment_tag primary key, which
        # would surface as a 500 on a request that has simply already been made.
        if tag not in shipment.tags:
            shipment.tags.append(tag)
        return await self._update(shipment)

    async def delete_tag(self, id: UUID, tag_name: TagName, seller: "Seller"):
        shipment = await self._get_owned(id, seller)
        tag = await self._get_tag(tag_name)
        try:
            shipment.tags.remove(tag)
        except ValueError:
            raise EntityNotFound("That tag is not on this shipment")
        return await self._update(shipment)
