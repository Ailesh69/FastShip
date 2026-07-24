from typing import Sequence

from core.exception import DeliveryPartnerNotAvailable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import any_
from sqlmodel import select
from services.User import UserService
from schemas.shipment import Shipment
from schemas.DeliveryPartner import DeliveryPartner, DPCreate


class DeliveryPartnerService(UserService):
    def __init__(self, model, session: AsyncSession):
        super().__init__(model, session)

    async def add(self, dp: DPCreate) -> DeliveryPartner:
        return await self._add_user(dp.model_dump(),"partner")

    async def login(self, email: str, password: str) -> str:
        return await self._generate_token(email, password)

    async def update(self, partner: DeliveryPartner) -> DeliveryPartner:
        return await self._update(partner)

    async def get_partner_by_zipcode(self, zipcode: int) -> Sequence[DeliveryPartner]:
        return (
            await self.session.scalars(
                select(DeliveryPartner).where(
                    zipcode == any_(DeliveryPartner.serviceable_zip_codes)
                )
            )
        ).all()

    async def assign_shipment(self, shipment: Shipment) -> DeliveryPartner:
        eligible_partners = await self.get_partner_by_zipcode(shipment.destination)
        if not eligible_partners:
            raise DeliveryPartnerNotAvailable("No delivery partner available")
        for partner in eligible_partners:
            if partner.current_handling_capacity > 0:
                partner.shipments.append(shipment)
                return partner
        raise DeliveryPartnerNotAvailable("No delivery partner available")
