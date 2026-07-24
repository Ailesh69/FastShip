from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.dialects import postgresql
from sqlalchemy import TIMESTAMP
from sqlmodel import Column, Field, SQLModel, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schemas.shipment import Shipment
    from schemas.Product import Product


class Order(SQLModel, table=True):
    __tablename__ = "order"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    shipment_id: UUID = Field(foreign_key="shipment.id")
    product_id: UUID = Field(foreign_key="product.id")
    created_at: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True),
            default=lambda: datetime.now(tz=timezone.utc),
        )
    )
    quantity: int = Field(default=1)

    shipment: "Shipment" = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"},
    )
    product: "Product" = Relationship(
        back_populates="orders",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class OrderRead(SQLModel):
    id: UUID
    quantity: int
    created_at: datetime
    product: "ProductRead"


from schemas.Product import ProductRead  # noqa: E402
OrderRead.model_rebuild()
