from datetime import datetime, timezone
from typing import TYPE_CHECKING
from pydantic import BaseModel, EmailStr
from sqlalchemy import TIMESTAMP

from sqlmodel import Field, Relationship, Column
from uuid import UUID, uuid4
from sqlalchemy.dialects import postgresql
from schemas.User import User

if TYPE_CHECKING:
    from schemas.shipment import Shipment


class Seller(User, table=True):
    __tablename__ = "seller"
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
    address: str | None = Field(default=None)
    zipcode: int | None = Field(default=None)
    shipments: list["Shipment"] = Relationship(
        back_populates="seller", sa_relationship_kwargs={"lazy": "selectin"}
    )


class BaseSeller(BaseModel):
    name: str
    email: EmailStr


class SellerRead(BaseSeller):
    id : UUID 
    email_verified : bool
    zipcode : int | None 
    created_at : datetime


class SellerCreate(BaseSeller):
    password: str
    zipcode : int
