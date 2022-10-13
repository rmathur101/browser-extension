from typing import List
from api import models, crud
from fastapi import Depends, HTTPException, APIRouter
import dotenv
from api.discord_utils import Oauth

config = dotenv.dotenv_values()
GUILD_ID_1729 = config["GUILD_ID_1729"]
discord_oauth = Oauth(
    config["CLIENT_ID"],
    config["CLIENT_SECRET"],
    config["REDIRECT_URL"],
    scope="identify email guilds",
)


router = APIRouter()


@router.get("/discord")
async def login():
    url = discord_oauth.get_authorization_url()
    return {"url": url}


@router.post("/discord")
async def update_user_discord_data(user_id: int, code: str):
    tokens = discord_oauth.get_access_token(code=code)
    discord_user = discord_oauth.get_user(access_token=tokens["access_token"])
    guilds = discord_oauth.get_guilds(access_token=tokens["access_token"])

    # Check if user is in 1729 guild
    if not any([guild["id"] == GUILD_ID_1729 for guild in guilds]):
        raise HTTPException(status_code=404, detail="User not in 1729")

    user = models.User(
        id=user_id,
        discord_id=discord_user["id"],
        discord_username=discord_user["username"],
        discord_avatar=discord_user["avatar"],
    )
    crud.user.update(user)

    return {"success": True}

