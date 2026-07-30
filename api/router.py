from api.routers import seller, shipment, DeliveryPartner, client
from fastapi import APIRouter

master_router = APIRouter()
master_router.include_router(shipment.router)
master_router.include_router(seller.router)
master_router.include_router(DeliveryPartner.router)
master_router.include_router(client.router)