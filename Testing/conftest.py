from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from main import app
from httpx import AsyncClient, ASGITransport
import pytest_asyncio
from config import db_settings
from sqlmodel import SQLModel
from schemas.seller import Seller
from schemas.shipment import Shipment
from schemas.Order import Order
from schemas.DeliveryPartner import DeliveryPartner
from schemas.ShipmentTag import ShipmentTag
from schemas.ShipmentEvent import ShipmentEvent
from schemas.Tag import Tag
from schemas.Product import Product
from schemas.Review import Review
from sqlalchemy.orm import sessionmaker
from Database.session import get_session

test_engine = create_async_engine(db_settings.POSTGRES_TEST_URL)


@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_end():
    print("Starting testss...")
    async with test_engine.begin() as test_connection:
        await test_connection.run_sync(SQLModel.metadata.create_all)
    async_session = sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def get_test_session():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    yield
    app.dependency_overrides.clear()
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    print("Finished>>>>>>")
