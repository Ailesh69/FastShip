from services.DeliveryPartner import DeliveryPartnerService
from services.ShipmentEvent import ShipmentEventService
from services.shipment import ShipmentService
from schemas.DeliveryPartner import DeliveryPartner
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from Database.session import get_session

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_shipment_service(session: SessionDep):
    return ShipmentService(
        session,
        DeliveryPartnerService(DeliveryPartner, session),
        ShipmentEventService(session),
    )


Shipment_ServiceDep = Annotated[ShipmentService, Depends(get_shipment_service)]
