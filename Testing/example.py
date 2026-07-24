from schemas.DeliveryPartner import DeliveryPartner
from schemas.shipment import Shipment
from schemas.seller import Seller
from schemas.DeliveryPartner import DeliveryPartner
from sqlalchemy.ext.asyncio import AsyncSession
from services.User import pwd_ctx

SELLER = {
    "name": "RainForest",
    "email": "rainforestr@gmail.com",
    "password": "trees",
    "zip_code": 11001,
}
DELIVERY_PARTNER = {
    "name": "Phil",
    "email": "phil@gmail.com",
    "password": "tough",
    "zip_code": 11002,
    "max_handling_capacity": 2,
    "serviceable_zip_codes": [11001, 11212, 123112, 22313],
}
SHIPMENT = {
    "content": "Bananas",
    "weight": 1.25,
    "destination": 11001,
    "client_Email": "py@email.org",
}


async def create_test_data(session: AsyncSession):
    session.add(
        Seller(
            name=SELLER["name"],
            email=SELLER["email"],
            zip_code=SELLER["zip_code"],
            email_verified=True,
            password_hash=pwd_ctx.hash(SELLER["password"][:72]),
        )
    )
    session.add(
        DeliveryPartner(
            name=DELIVERY_PARTNER["name"],
            email=DELIVERY_PARTNER["email"],
            password_hash=pwd_ctx.hash(DELIVERY_PARTNER["password"][:72]),
            email_verified=True,
            serviceable_zip_codes=DELIVERY_PARTNER["serviceable_zip_codes"],
            max_handling_capacity=DELIVERY_PARTNER["max_handling_capacity"],
        )
    )
    await session.commit()
