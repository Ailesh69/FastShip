from sqlmodel import SQLModel, Field, Column, TIMESTAMP, Relationship
from uuid import UUID, uuid4
from sqlalchemy.dialects import postgresql
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schemas.shipment import Shipment


class Review(SQLModel, table=True):
    __tablename__ = "review"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    created_at: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True), default=lambda: datetime.now(tz=timezone.utc)
        )
    )
    rating: int | None = Field(default=None, ge=1, le=5)
    feedback: str | None = Field(default=None)
    shipment_id: UUID = Field(foreign_key="shipment.id")
    shipment: "Shipment" = Relationship(
        back_populates="review", sa_relationship_kwargs={"lazy": "selectin"}
    )
