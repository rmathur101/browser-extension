from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, BigInteger, ForeignKeyConstraint
from datetime import datetime

if TYPE_CHECKING:
    from .url_user import UrlUser


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
    url_user: "UrlUser" = Relationship(back_populates="tags")


class TagCreate(TagBase):
    id: int
    url_id: int
    user_id: int


class TagRead(TagBase):
    id: int
