from typing import TYPE_CHECKING, Optional, List
from sqlmodel import SQLModel


class DiscordAddUserData(SQLModel):
    # RM: I'm commenting out the user_id as a parameter because the endpoint that used this validation will not require user id, instead it will check based on the discord code if the user associated with the discord id is already in the db, if it is, then it is just like a login step, if it is not, then we create the user
    # user_id: int
    code: str
