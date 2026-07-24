from pydantic import EmailStr
from sqlmodel import SQLModel, Field


class User(SQLModel):
    name: str
    email: EmailStr
    email_verified: bool = Field(default=False)
    password_hash: str = Field(exclude=True)
