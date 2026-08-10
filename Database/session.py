
from sqlalchemy.ext.asyncio import create_async_engine , AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import  SQLModel
from config import db_settings
engine = create_async_engine(
    url=db_settings.POSTGRES_URL,
    echo=True,
)


async def create_db_tables():
    async with engine.begin() as connection:
        from schemas.shipment import Shipment  # noqa: F401
        from schemas.seller import Seller  # noqa: F401
        await connection.run_sync(SQLModel.metadata.create_all)
    await seed_tags()


# One row per TagName. Nothing ever inserted these, so the tag table was always
# empty and TagName.tag() always returned None — which made every tag endpoint
# (add, remove, list-by-tag) fail on a None the callers never checked for. The
# tag vocabulary is a fixed enum, so the rows belong to the schema, not to data
# entry.
_TAG_INSTRUCTIONS = {
    "EXPRESS": "Prioritise this shipment; deliver ahead of standard traffic.",
    "STANDARD": "Normal handling and routing.",
    "FRAGILE": "Handle with care. Do not stack, drop or compress.",
    "HEAVY": "Requires two-person lift or equipment.",
    "INTERNATIONAL": "Customs paperwork must travel with the parcel.",
    "RETURN": "Return leg — collect from the recipient and route back to sender.",
}


async def seed_tags():
    """Insert any missing tag rows. Safe to run on every startup."""
    from sqlmodel import select

    from schemas.Tag import Tag, TagName

    async with AsyncSession(engine) as session:
        existing = set((await session.scalars(select(Tag.name))).all())
        missing = [name for name in TagName if name.value not in existing]
        if not missing:
            return
        for name in missing:
            session.add(Tag(name=name, instruction=_TAG_INSTRUCTIONS[name.value]))
        await session.commit()



async def get_session():
    async_session = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,

    )
    async with async_session() as session:
        yield session


