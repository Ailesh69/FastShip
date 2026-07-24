from sqlalchemy import Column, TIMESTAMP
from sqlalchemy.dialects import postgresql
from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime, timezone
from Database.models import ShipmentStatus

if TYPE_CHECKING:
    from schemas.shipment import Shipment


class ShipmentEvent(SQLModel, table=True):
    __tablename__ = "shipment_event"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4()
        ),
    )
    created_at: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True), default=lambda: datetime.now(tz=timezone.utc)
        )
    )
    location: int
    status: ShipmentStatus
    Description: str | None = Field(default=None)
    shipment_id: UUID = Field(foreign_key="shipment.id")
    shipment: "Shipment" = Relationship(
        back_populates="timeline", sa_relationship_kwargs={"lazy": "selectin"}
    )
