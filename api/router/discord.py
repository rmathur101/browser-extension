from typing import List
from api import models, crud
from fastapi import Depends, HTTPException, APIRouter
import dotenv
from api.discord_utils import Oauth
import json
from pathlib import Path

config = dotenv.dotenv_values()
DATA_DIR = Path(config["DATA_DIR"])
GUILD_ID_1729 = config["GUILD_ID_1729"]
discord_oauth = Oauth(
    config["CLIENT_ID"],
    config["CLIENT_SECRET"],
    config["REDIRECT_URL"],
    scope="identify email guilds",
)


router = APIRouter()


@router.get("/discord")
async def go_to_discord_authentication_page():
    url = discord_oauth.get_authorization_url()
    return {"url": url}


@router.post("/discord")
async def update_user_discord_data(discord_user: models.DiscordAddUserData):
    tokens = discord_oauth.get_access_token(code=discord_user.code)
    discord_data = discord_oauth.get_user(access_token=tokens["access_token"])
    guilds = discord_oauth.get_guilds(access_token=tokens["access_token"])

    # Check if user is in 1729 guild
    if not any([guild["id"] == GUILD_ID_1729 for guild in guilds]):
        raise HTTPException(status_code=404, detail="User not in 1729")

    user = models.User(
        id=discord_user.user_id,
        discord_id=discord_data["id"],
        discord_username=discord_data["username"],
        discord_avatar=discord_data["avatar"],
    )
    user = crud.user.update(user)

    # Check if user has shared any urls in discord. If so update user_id
    # for these urls and delete temp user created for discord links
    user_discord_only = crud.user.where(
        dict(discord_id=discord_user.user_id, email="discord_only")
    )
    if user_discord_only:
        user_discord_only = user_discord_only[0]
        crud.url_user._update_user_for_discord_urls(
            user_id=user.id, discord_user_id=user_discord_only.id
        )
        crud.user.delete(id=user_discord_only.id)

    return {"detail": "Discord data updated"}


@router.get("/discord/{user_id}")
async def get_user_channels_and_threads(user_id):
    # RM: this function is used to convert the channel ids to strings
    def stringify_ids(channels):
        for channel in channels:
            channel["id"] = str(channel["id"])
        return channels

    with open(DATA_DIR / "metadata" / "server_metadata.json", "r") as f:
        channels = json.load(f)
        return stringify_ids(channels)
