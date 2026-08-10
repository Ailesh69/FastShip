from datetime import timezone, datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import ARRAY, Integer, TIMESTAMP
from schemas.User import User
from uuid import UUID, uuid4
from sqlalchemy.dialects import postgresql
from sqlmodel import Field, Column, Relationship
from pydantic import BaseModel, EmailStr
from Database.models import ShipmentStatus

if TYPE_CHECKING:
    from schemas.shipment import Shipment


class DeliveryPartner(User, table=True):
    __tablename__ = "delivery_partner"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    # See the note on Seller.email — same missing constraint, same consequence.
    email: EmailStr = Field(unique=True, index=True)
    serviceable_zip_codes: list[int] = Field(sa_column=Column(ARRAY(Integer)))
    zipcode: int | None = Field(default=None)
    max_handling_capacity: int
    created_At: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True), default=lambda: datetime.now(tz=timezone.utc)
        )
    )
    shipments: List["Shipment"] = Relationship(
        back_populates="delivery_partner", sa_relationship_kwargs={"lazy": "selectin"}
    )

    @property
    def active_shipments(self) -> "list[Shipment]":
        return [
            s
            for s in self.shipments
            if s.status != ShipmentStatus.delivered
            and s.status != ShipmentStatus.cancelled
        ]

    @property
    def current_handling_capacity(self) -> int:
        return self.max_handling_capacity - len(self.active_shipments)


class BaseDP(BaseModel):
    name: str
    email: EmailStr
    zipcode : int 
    serviceable_zip_codes: list[int]
    max_handling_capacity: int


class DPRead(BaseDP):
    # Matches what SellerRead and ClientRead already expose, so the profile
    # screens can show the same identity and verification state for all roles.
    id: UUID
    email_verified: bool


class DPCreate(BaseDP):
    password: str


class DPUpdate(BaseModel):
    email: EmailStr
    zipcode : int | None = None 
    serviceable_zip_codes: list[int] | None = None
    max_handling_capacity: int | None = None
