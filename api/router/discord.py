from typing import List
from api import models, crud 
from fastapi import Depends, HTTPException, APIRouter
import dotenv
from api.discord_utils import Oauth
import json
from pathlib import Path
from logger import logger

config = dotenv.dotenv_values()
DATA_DIR = Path(config["DATA_DIR"])
GUILD_ID_1729 = config["GUILD_ID_1729"]
discord_oauth = Oauth(
    config["CLIENT_ID"],
    config["CLIENT_SECRET"],
    config["REDIRECT_URL"],
    scope="identify guilds",
)
# RM NOTE: This is what we used for the old scope: scope="identify email guilds. I changed the scope on both the client and here on the backend because I don't think we need the email.",

router = APIRouter()

@router.get("/discord")
async def go_to_discord_authentication_page():
    url = discord_oauth.get_authorization_url()
    return {"url": url}


@router.post("/discord")
async def update_user_discord_data(discord_user: models.DiscordAddUserData):
    try:
        # Get discord tokens using code from authentication and check if access token is available 
        tokens = discord_oauth.get_access_token(code=discord_user.code)
        if (not ("access_token" in tokens)):
            raise HTTPException(status_code=500, detail="No access token found with the discord code that was sent after authentication.")

        # Use tokens to get discord data including guilds
        discord_data = discord_oauth.get_user(access_token=tokens["access_token"])
        guilds = discord_oauth.get_guilds(access_token=tokens["access_token"])

        # Check if user is in 1729 guild
        if not any([guild["id"] == GUILD_ID_1729 for guild in guilds]):
            raise HTTPException(status_code=500, detail="This user does not have the 1729 guild in their guilds list.")

        # RM: check if the user with this discord id already exists
        user = crud.user.get_by_discord_id(discord_data["id"]) 
        if (not user):
            user = models.User(
                discord_id=discord_data["id"],
                discord_username=discord_data["username"],
                discord_avatar=discord_data["avatar"],
            )
            user = crud.user.create(user)

            logger.info("New user created.", user_id=user.id, discord_username=user.discord_username)
            return {"status_code": 200, "detail": "User created"}
        else:
            logger.info("This user already has account.", user_id=user.id, discord_username=user.discord_username)
            return {"status_code": 200, "detail": "User already has account."}

        # RM NOTE: I'm commenting this out because I don't think we need it. If we do, we can uncomment it. Basically I can't think of why assigning the shares to a user after they logged in would be important, this should be fine for now.
        # Check if user has shared any urls in discord. If so update user_id
        # for these urls and delete temp user created for discord links
        # user_discord_only = crud.user.where(
        #     dict(discord_id=discord_user.user_id, email="discord_only")
        # )
        # if user_discord_only:
        #     user_discord_only = user_discord_only[0]
        #     crud.url_user._update_user_for_discord_urls(
        #         user_id=user.id, discord_user_id=user_discord_only.id
        #     )
        #     crud.user.delete(id=user_discord_only.id)
    except Exception as e:
        logger.error("Error in /discord endpoint", error=e, discord_user=discord_user)
        return {"status_code": 500}

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
