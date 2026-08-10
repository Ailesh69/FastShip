from datetime import datetime
from typing import TYPE_CHECKING, Optional
from pydantic import BaseModel, EmailStr, model_validator
import sqlalchemy as sa
from sqlalchemy import TIMESTAMP
from sqlmodel import SQLModel, Field, Relationship, Column
from Database.models import ShipmentStatus
from uuid import uuid4, UUID
from sqlalchemy.dialects import postgresql

from schemas.Tag import Tag, TagName  # noqa: F401
from schemas.ShipmentTag import ShipmentTag

if TYPE_CHECKING:
    from schemas.DeliveryPartner import DeliveryPartner
    from schemas.seller import Seller
    from schemas.ShipmentEvent import ShipmentEvent
    from schemas.Review import Review
    from schemas.Order import Order, OrderRead


class BaseShipment(SQLModel):
    content: str = Field(max_length=100)
    weight: float = Field(le=25)
    destination: int = Field(description="Location zipcode")


class Shipment(BaseShipment, table=True):
    __tablename__ = "shipment"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    status: ShipmentStatus
    # TIMESTAMP WITH TIME ZONE, matching created_at on every other table. It was
    # the one bare `datetime` in the schema, so Postgres stored it naive: the
    # offset was dropped on the way in, and the JSON that came back out had no
    # offset either — which `new Date()` in the browser reads as LOCAL time
    # while it reads timeline timestamps as UTC. Delivery estimates and the
    # events they sit beside were being rendered on two different clocks.
    estimated_delivery: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False)
    )
    timeline: list["ShipmentEvent"] = Relationship(
        back_populates="shipment", sa_relationship_kwargs={"lazy": "selectin"}
    )
    client_contact_email: EmailStr | None = Field(default=None)
    client_contact_phone: str | None = Field(default=None)

    @model_validator(mode="after")
    def require_at_least_one_contact(self):
        if self.client_contact_email is None and self.client_contact_phone is None:
            raise ValueError(
                "At least one of client_contact_email or client_contact_phone must be provided"
            )
        return self

    seller_id: UUID = Field(foreign_key="seller.id")
    seller: Optional["Seller"] = Relationship(
        back_populates="shipments", sa_relationship_kwargs={"lazy": "selectin"}
    )
    delivery_partner_id: Optional[UUID] = Field(
        default=None, foreign_key="delivery_partner.id"
    )
    delivery_partner: Optional["DeliveryPartner"] = Relationship(
        back_populates="shipments", sa_relationship_kwargs={"lazy": "selectin"}
    )

    # `status` is the mapped column declared above, kept equal to the newest
    # timeline event by ShipmentEventService.add().
    #
    # There used to be a `status` @property here returning the last timeline
    # entry. It never ran: SQLAlchemy instruments the mapped attribute onto the
    # class after the body executes, so the property object was replaced by the
    # column's InstrumentedAttribute and silently discarded. The column was only
    # ever written once, at creation, so every shipment reported "placed"
    # forever — and DeliveryPartner.active_shipments, which filters on it, never
    # shrank, permanently exhausting each partner's handling capacity.

    review: "Review" = Relationship(
        back_populates="shipment", sa_relationship_kwargs={"lazy": "selectin"}
    )
    tags: list[Tag] = Relationship(
        back_populates="shipments",
        link_model=ShipmentTag,
        sa_relationship_kwargs={"lazy": "immediate"},
    )
    orders: list["Order"] = Relationship(
        back_populates="shipment",
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ShipmentCreate(BaseShipment):
    """Shipment details to create a new shipment."""

    client_contact_email: EmailStr | None = Field(default=None)
    client_contact_phone: str | None = Field(default=None)

    @model_validator(mode="after")
    def require_at_least_one_contact(self):
        if self.client_contact_email is None and self.client_contact_phone is None:
            raise ValueError(
                "At least one of client_contact_email or client_contact_phone must be provided"
            )
        return self


class ShipmentPartnerRead(SQLModel):
    """The assigned partner as seen from a shipment — name only, no contact
    details or capacity, since sellers read this off their dashboard."""

    id: UUID
    name: str


class ShipmentRead(BaseShipment):
    id: UUID
    timeline: list["ShipmentEvent"]
    estimated_delivery: datetime
    tags: list[Tag]
    orders: list["OrderRead"]
    # Scalars below were already exposed by the endpoints that returned the
    # `Shipment` table model directly; they are declared here so those routes
    # can move to this schema (and gain `timeline`/`tags`) without dropping
    # anything a caller already had.
    status: ShipmentStatus | None = None
    client_contact_email: EmailStr | None = None
    client_contact_phone: str | None = None
    seller_id: UUID | None = None
    delivery_partner_id: UUID | None = None
    delivery_partner: ShipmentPartnerRead | None = None


class ShipmentUpdate(BaseModel):
    location: int | None = Field(default=None)
    status: Optional[ShipmentStatus] = Field(default=None)
    verification_code: str | None = Field(default=None)
    description: str | None = Field(default=None)
    estimated_delivery: Optional[datetime] = Field(default=None)


class ShipmentReview(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    feedback: str | None = Field(default=None)


from schemas.ShipmentEvent import ShipmentEvent  # noqa: E402
from schemas.Order import Order, OrderRead  # noqa: E402

ShipmentRead.model_rebuild()
