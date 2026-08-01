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


class Client(User, table=True):
    __tablename__ = "client"
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(
            postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4
        ),
    )
    email: EmailStr = Field(unique=True, index=True)
    created_at: datetime = Field(
        sa_column=Column(
            TIMESTAMP(timezone=True), default=lambda: datetime.now(tz=timezone.utc)
        )
    )
    shipments: list["Shipment"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "foreign(Shipment.client_contact_email)==Client.email",
            "viewonly": True,
            "lazy": "selectin",
        }
    )


class BaseClient(BaseModel):
    name: str
    email: EmailStr


class ClientRead(BaseClient):
    id: UUID
    email_verified: bool
    created_at: datetime


class ClientCreate(BaseClient):
    password: str
