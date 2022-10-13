import enum
from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger, ForeignKey, ForeignKeyConstraint
from datetime import datetime
from pydantic import Extra
from .mixins import Timestamp

if TYPE_CHECKING:
    from .tag import Tag, TagRead
    from .url import Url, UrlRead
    from .user import User


class Rating(enum.IntEnum):
    very_bad = 1
    bad = 2
    okay = 3
    good = 4
    very_good = 5


class UrlUserBase(SQLModel):
    user_id: int = Field(foreign_key="user.id", primary_key=True, index=True)

    user_descr: Optional[str] = None
    metadata_descr: Optional[str] = None
    rating: Optional[Rating] = None
    bookmark: Optional[bool] = None
    share: Optional[bool] = None
    document_title: Optional[str] = None
    custom_title: Optional[str] = None


class UrlUser(Timestamp, UrlUserBase, table=True):
    url_id: int = Field(
        sa_column=Column(
            BigInteger(), ForeignKey("url.id"), primary_key=True, index=True
        )
    )
    discord_reactions: Optional[int] = None
    discord_msg_id: Optional[int] = Field(
        sa_column=Column(BigInteger(), default=None, autoincrement=False, nullable=True)
    )
    discord_channel_id: Optional[int] = Field(
        sa_column=Column(BigInteger(), default=None, autoincrement=False, nullable=True)
    )

    user: Optional["User"] = Relationship(back_populates="urls")
    url: "Url" = Relationship(back_populates="url_users")
    tags: Optional[List["Tag"]] = Relationship(back_populates="url_user")


class UrlUserCreateApi(UrlUserBase, extra=Extra.allow):
    url: str
    tags: Optional[List[str]] = None


class UrlUserUpdateApi(UrlUserBase):
    tags: Optional[List[str]] = None


class UrlUserUpdate(UrlUserBase):
    url_id: int
    tags: Optional[List[str]] = None


class UrlUserRead(UrlUserBase):
    url_id: int
    created_at: datetime
    url: Optional["UrlRead"]
    tags: List["TagRead"]
