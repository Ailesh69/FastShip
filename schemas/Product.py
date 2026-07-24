from uuid import UUID, uuid4
from sqlalchemy.dialects import postgresql
from sqlmodel import Column, Field, SQLModel, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schemas.Order import Order


class Product(SQLModel, table=True):
    __tablename__ = "product"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    title: str
    description: str
    price: float
    weight: float
    orders: list["Order"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ProductCreate(SQLModel):
    title: str
    description: str
    price: float
    weight: float


class ProductRead(SQLModel):
    id: UUID
    title: str
    description: str
    price: float
    weight: float
