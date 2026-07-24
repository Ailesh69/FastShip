from uuid import UUID
from typing import TYPE_CHECKING
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from Database.redis import add_otp
from services.Base import BaseService
from schemas.shipment import Shipment, ShipmentCreate, ShipmentStatus, ShipmentUpdate
from services.DeliveryPartner import DeliveryPartnerService
from services.ShipmentEvent import ShipmentEventService
from core.exception import ClientNotAuthorized, EntityNotFound, InvalidToken

from utils import decode_url_safe_token

from schemas.Review import Review
from schemas.Tag import TagName

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
        shipment = await self.get(id)
        if not shipment:
            raise EntityNotFound()
        return shipment

    async def add(self, shipment_create: ShipmentCreate, seller: "Seller") -> Shipment:
        new_shipment = Shipment(
            **shipment_create.model_dump(),
            status=ShipmentStatus.placed,
            estimated_delivery=datetime.now() + timedelta(days=3),
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
            code = await add_otp(shipment.id)
            if code != shipment_update.verify_otp:
                raise ClientNotAuthorized()
        update = shipment_update.model_dump(exclude_none=True, exclude=["verify_otp"])
        if shipment_update.estimated_delivery:
            shipment.estimated_delivery = shipment_update.estimated_delivery
        if len(update) > 1 or not shipment_update.estimated_delivery:
            await self.event_service.add(
                shipment=shipment,
                **update,
            )
        return await self._update(shipment)

    def validate_review_token(self, token: str) -> dict:
        token_data = decode_url_safe_token(token)
        if not token_data:
            raise InvalidToken("Invalid or expired review link")
        return token_data

    async def rate(self, token: str, rating: int, comment: str | None = None):
        token_data = self.validate_review_token(token)
        if not token_data:
            raise InvalidToken()
        shipment = await self.get(UUID(token_data["id"]))
        if shipment is None:
            raise EntityNotFound("Shipment not found")
        new_review = Review(
            rating=rating,
            feedback=comment if comment else None,
            shipment_id=shipment.id,
        )
        self.session.add(new_review)
        await self.session.commit()

    async def cancel(self, id: UUID, seller: "Seller") -> Shipment:
        shipment = await self.get(id)
        if shipment.seller_id != seller.id:
            raise EntityNotFound("ID NOT FOUND")
        event = await self.event_service.add(
            shipment=shipment, status=ShipmentStatus.cancelled
        )
        shipment.timeline.append(event)
        return shipment

    async def delete(self, id: UUID) -> None:
        await self._delete(await self.get(id))

    async def add_tag(self, id: UUID, tag_name: TagName):
        shipment = await self.get(id)
        shipment.tags.append(await tag_name.tag(self.session))
        return await self._update(shipment)

    async def delete_tag(self, id: UUID, tag_name: TagName):
        shipment = await self.get(id)
        try:
            shipment.tags.remove(await tag_name.tag(self.session))
        except ValueError:
            raise EntityNotFound()
