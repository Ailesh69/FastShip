from schemas.DeliveryPartner import DeliveryPartner
from schemas.shipment import Shipment
from schemas.seller import Seller
from 
from sqlalchemy.ext.asyncio import AsyncSession
from services.User import pwd_ctx
SELLER = {
    "name":"RainForest",
    "email":"rainforestr@gmail.com",
    "password":"trees",
    "zip_code":11001
}
DELIVERY_PARTNER = {
    "name" : "Phil",
    "email" : "phil@gmail.com",
    "password":"tough",
    "zip_code": 11002,
    "max_handling_capacity":2,
    "serviceable_zip_codes":[11001,11212,123112,22313]
}
SHIPMENT ={
    "content":"Bananas",
    "weight":1.25,
    "destinatiom":11084,
    "client_contact_email":"py@email.org"
}

async def create_test_data(session:AsyncSession):
    session.add(
        Seller(
            **SELLER,
            email_verified = True,
            password_hash=pwd_ctx.hash(SELLER["password"]),
        )
    )
    session.add(
        DeliveryPartner(
            **DELIVERY_PARTNER,
            email_verified=True,
            passwword_hash = pwd_ctx.hash(DELIVERY_PARTNER["password"]),
            serviceable_zip_codes=[Location(zip_code=zip_code) for zip_code in DELIVERY_PARTNER]
        )
        
    )