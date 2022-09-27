import enum
from sys import int_info

from pydantic import AnyHttpUrl, Extra
from typing import Optional, List, TYPE_CHECKING
from pydantic import AnyHttpUrl
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger, ForeignKey, ForeignKeyConstraint

# ###   Link tables  ###
# class UrlTagLink(SQLModel, table=True):
#     url_id: Optional[int] = Field(default=None, foreign_key="url.id", primary_key=True)
#     tag_id: Optional[int] = Field(default=None, foreign_key="tag.id", primary_key=True)


###   UrlUser models   ###
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


class UrlUser(UrlUserBase, table=True):
    url_id: int = Field(
        sa_column=Column(
            BigInteger(), ForeignKey("url.id"), primary_key=True, index=True
        )
    )

    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)

    user: Optional["User"] = Relationship(back_populates="urls")
    url: "Url" = Relationship(back_populates="url_users")
    tags: Optional[List["Tag"]] = Relationship(back_populates="url_user")


class UrlUserCreateApi(UrlUserBase, extra=Extra.allow):
    url: str
    tags: Optional[List[str]] = None


class UrlUserCreateDB(UrlUserBase):
    url_id: int
    tags: Optional[List[str]] = None


###   User models   ###
class UserBase(SQLModel):
    email: str = Field(index=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)

    discord_id: Optional[int] = Field(
        sa_column=Column(BigInteger(), default=None, autoincrement=False,)
    )
    discord_username: Optional[str] = None
    discord_avatar: Optional[str] = None

    urls: Optional[List[UrlUser]] = Relationship(back_populates="user")


class UserCreate(UserBase):
    ...


class UserRead(UserBase):
    id: int
    email: Optional[str] = None


class UserUpdate(UserBase):
    id: int
    email: str


###   Bookmark models   ###
class UrlBase(SQLModel):
    url: AnyHttpUrl


class Url(UrlBase, table=True):
    id: int = Field(
        sa_column=Column(
            BigInteger(), primary_key=True, autoincrement=False, index=True
        )
    )
    url_users: List[UrlUser] = Relationship(back_populates="url")
    # user: List["User"] = Relationship(back_populates="urls", link_model=UrlUser)

    # tags: Optional[List["Tag"]] = Relationship(back_populates="url", link_model=UrlUser)


class UrlCreate(UrlBase):
    id: int


class UrlRead(UrlBase):
    ...


# ###   Tag models   ###
class TagBase(SQLModel):
    name: str = Field(index=True)
    id: int = Field(
        sa_column=Column(
            BigInteger(), primary_key=True, autoincrement=False, index=True
        )
    )


class Tag(TagBase, table=True):
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "url_id"], ["urluser.user_id", "urluser.url_id"],
        ),
    )

    url_id: int = Field(sa_column=Column(BigInteger(), primary_key=True, index=True))
    user_id: int = Field(index=True, primary_key=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)
    url_user: UrlUser = Relationship(back_populates="tags")


class TagCreate(TagBase):
    id: int
    url_id: int
    user_id: int


class TagRead(TagBase):
    id: int


# ###  joined models   ###


# class UrlRead(UrlBase):
#     id: int
#     users: List[UserRead]
#     tags: Optional[List[TagBase]]


# class UrlReadWithTags(UrlRead):
#     tags: List[TagBase] = []


class UrlUserRead(UrlUserBase):
    url_id: int
    created_at: datetime
    url: UrlRead
    tags: List[TagRead]


class UserReadWithUrls(UserRead):
    urls: List[UrlUserRead] = []
