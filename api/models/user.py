from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger, ForeignKeyConstraint
from datetime import datetime
from .mixins import Timestamp

if TYPE_CHECKING:
    from .url_user import UrlUser, UrlUserRead


class UserBase(SQLModel):
    email: Optional[str] = Field(index=True)


class User(UserBase, Timestamp, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    discord_id: Optional[int] = Field(
        sa_column=Column(BigInteger(), default=None, autoincrement=False,)
    )
    discord_username: Optional[str] = None
    discord_avatar: Optional[str] = None

    urls: Optional[List["UrlUser"]] = Relationship(back_populates="user")


class UserCreate(UserBase):
    ...


class UserRead(UserBase):
    id: int
    email: Optional[str] = None


class UserUpdate(UserBase):
    id: int
    email: str


class UserReadWithUrls(UserRead):
    urls: List["UrlUserRead"] = []

