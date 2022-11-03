from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger
from datetime import datetime
from pydantic import AnyHttpUrl

if TYPE_CHECKING:
    from .url_user import UrlUser


class UrlBase(SQLModel):
    url: AnyHttpUrl
    title: str


class Url(UrlBase, table=True):
    id: int = Field(
        sa_column=Column(
            BigInteger(), primary_key=True, autoincrement=False, index=True
        )
    )
    description: Optional[str] = None
    embedded: Optional[bool] = False

    url_users: List["UrlUser"] = Relationship(back_populates="url")


class UrlCreate(UrlBase):
    id: int


class UrlRead(UrlBase):
    ...
