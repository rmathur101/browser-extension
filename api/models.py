import enum

from pydantic import AnyHttpUrl, Extra
from typing import Optional, List, TYPE_CHECKING
from pydantic import AnyHttpUrl
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger, ForeignKey

###   User models   ###
class UserBase(SQLModel, extra=Extra.allow):
    email: str = Field(index=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=False)
    )

    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)
    urls: Optional[List["Url"]] = Relationship(back_populates="user")


class UserCreate(UserBase):
    ...


class UserRead(UserBase):
    id: int
    created_at: datetime


class UserUpdate(UserBase):
    id: int
    email: str


###   Bookmark models   ###
class Rating(enum.IntEnum):
    very_bad = 1
    bad = 2
    okay = 3
    good = 4
    very_good = 5


class UrlBase(SQLModel):
    url: AnyHttpUrl
    user_descr: Optional[str] = None
    metadata_descr: Optional[str] = None
    rating: Optional[Rating] = None
    bookmark: Optional[bool] = None
    share: Optional[bool] = None


class Url(UrlBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)

    user: "User" = Relationship(back_populates="urls")
    tags: Optional[List["Tag"]] = Relationship(back_populates="url")
    user_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("user.id"), index=True)
    )


###   Tag models   ###
class TagBase(SQLModel):
    name: str = Field(index=True)


class Tag(TagBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)
    url_id: int = Field(index=True, foreign_key="url.id")

    url: Url = Relationship(back_populates="tags")


class TagCreate(TagBase):
    url_id: int


class TagRead(TagBase):
    id: int
    url_id: int


###  joined models   ###
class UrlCreate(UrlBase):
    user_id: int
    tags: Optional[List[str]] = []


class UrlRead(UrlBase):
    id: int
    created_at: datetime
    user_id: int
    tags: Optional[List[TagBase]]


class UrlReadWithTags(UrlRead):
    tags: List[TagBase] = []


class UserReadWithUrls(UserRead):
    urls: List[UrlReadWithTags] = []
