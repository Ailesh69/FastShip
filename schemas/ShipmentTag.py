from uuid import UUID
from sqlmodel import SQLModel, Field


class ShipmentTag(SQLModel, table=True):
    __tablename__ = "shipment_tag"
    shipment_id: UUID = Field(foreign_key="shipment.id", primary_key=True)
    tag_id: UUID = Field(foreign_key="tag.id", primary_key=True)
