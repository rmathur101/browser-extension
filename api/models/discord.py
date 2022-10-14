from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel


class DiscordAddUserData(SQLModel):
    user_id: int
    code: str
