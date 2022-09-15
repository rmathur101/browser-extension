import enum

from pydantic import AnyHttpUrl
from typing import Optional, List, TYPE_CHECKING
from pydantic import AnyHttpUrl
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

###   User models   ###
class UserBase(SQLModel):
    email: str = Field(index=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)

    bookmarks: Optional[List["Bookmark"]] = Relationship(back_populates="user")


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


class BookmarkBase(SQLModel):
    url: AnyHttpUrl
    user_descr: Optional[str] = None
    metadata_descr: Optional[str] = None
    rating: Optional[Rating] = None

    user_id: int = Field(index=True, foreign_key="user.id")


class Bookmark(BookmarkBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)

    user: "User" = Relationship(back_populates="bookmarks")
    tags: Optional[List["Tag"]] = Relationship(back_populates="bookmark")


class BookmarkCreate(BookmarkBase):
    ...


class BookmarkRead(BookmarkBase):
    id: int
    created_at: datetime


###   Tag models   ###
class TagBase(SQLModel):
    name: str = Field(index=True)


class Tag(TagBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default=datetime.utcnow(), nullable=False)
    bookmark_id: int = Field(index=True, foreign_key="bookmark.id")

    bookmark: Bookmark = Relationship(back_populates="tags")


class TagCreate(TagBase):
    bookmark_id: int


class TagRead(TagBase):
    id: int
    bookmark_id: int


###  joined models   ###
class BookmarkReadWithTags(BookmarkRead):
    tags: List[TagBase] = []


class UserReadWithBookmarks(UserRead):
    bookmarks: List[BookmarkReadWithTags] = []
