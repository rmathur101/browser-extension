from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger
from datetime import datetime
from pydantic import AnyHttpUrl

if TYPE_CHECKING:
    from .url_user import UrlUser


class UrlBase(SQLModel):
    url: AnyHttpUrl


class Url(UrlBase, table=True):
    id: int = Field(
        sa_column=Column(
            BigInteger(), primary_key=True, autoincrement=False, index=True
        )
    )
    url_users: List["UrlUser"] = Relationship(back_populates="url")
    # user: List["User"] = Relationship(back_populates="urls", link_model=UrlUser)

    # tags: Optional[List["Tag"]] = Relationship(back_populates="url", link_model=UrlUser)


class UrlCreate(UrlBase):
    id: int


class UrlRead(UrlBase):
    ...
