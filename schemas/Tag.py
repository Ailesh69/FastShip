from enum import Enum
from uuid import UUID, uuid4
from sqlalchemy.dialects import postgresql
from sqlmodel import Column, Field, SQLModel, Relationship, select
from typing import TYPE_CHECKING
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.ShipmentTag import ShipmentTag

if TYPE_CHECKING:
    from schemas.shipment import Shipment


class TagName(str, Enum):
    EXPRESS = "EXPRESS"
    STANDARD = "STANDARD"
    FRAGILE = "FRAGILE"
    HEAVY = "HEAVY"
    INTERNATIONAL = "INTERNATIONAL"
    RETURN = "RETURN"

    async def tag(self, session: AsyncSession):
        return await session.scalar(select(Tag).where(Tag.name == self.value))


class Tag(SQLModel, table=True):
    __tablename__ = "tag"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    name: TagName
    instruction: str
    shipments: list["Shipment"] = Relationship(
        back_populates="tags",
        link_model=ShipmentTag,
        sa_relationship_kwargs={"lazy": "immedtiate"},
    )
