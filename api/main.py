from typing import List
from api import models, crud, utils
from db import create_db_and_tables, get_session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session
import dotenv
from discord_utils import Oauth, send_message


config = dotenv.dotenv_values()
GUILD_ID_1729 = config["GUILD_ID_1729"]
discord_oauth = Oauth(
    config["CLIENT_ID"],
    config["CLIENT_SECRET"],
    config["REDIRECT_URL"],
    scope="identify email guilds",
)

app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.post("/users/", response_model=models.UserRead)
def create_user(user: models.UserCreate):
    user_created = crud.user.create(user)
    return user_created


@app.get("/users/", response_model=List[models.UserRead])
def read_users(
    offset: int = 0, limit: int = Query(default=100, lte=500),
):
    users = crud.user.get_multi(offset, limit)
    return users


@app.get("/users/{user_id}", response_model=models.UserReadWithUrls)
def read_user(*, session: Session = Depends(get_session), user_id: int):
    user = session.get(models.User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@app.post("/url/", response_model=models.UrlUserRead)
def create_url(
    *, session: Session = Depends(get_session), url_user: models.UrlUserCreateApi
):
    # Get url and create if not exists
    url_str = url_user.url
    del url_user.url

    url_id = utils.str2int(url_str)
    url = models.UrlCreate(id=url_id, url=url_str)
    crud.url.insert_if_not_exists(url)

    # Get tags
    tags = url_user.tags
    del url_user.tags

    # Create url
    url_user.url_id = url_id

    try:
        url_user_created = crud.url_user.create(url_user)
    except IntegrityError:
        raise HTTPException(
            status_code=404,
            detail=f"The url {url_str} already exists for user {url_user.user_id}",
        )

    # # Create tags
    tags_created = []
    for tag in tags:
        tag_id = utils.str2int(tag)
        tag_obj = models.TagCreate(
            id=tag_id, name=tag, url_id=url_id, user_id=url_user.user_id
        )
        tag_db = crud.tag.create(tag_obj)
        tags_created.append(models.TagCreate(**tag_db.dict()))

    # Get created url
    url_user_created = crud.url_user.get(user_id=url_user.user_id, url_id=url_id)
    url_user_created = models.UrlUserRead(
        url=models.UrlRead(url=url_str), tags=tags_created, **url_user_created.dict()
    )

    # Check if url should be shared. And if so share to discord.
    if url_user.share:
        user = crud.user.get(url_user.user_id)
        if user.discord_id is None:
            raise HTTPException(
                status_code=404,
                detail=f"The user {url_user.user_id} has not linked their discord account",
            )
        else:
            send_message(message=url_user.user_descr, url=url_str, user=user)

    return url_user_created


@app.get("/discord")
async def login():
    url = discord_oauth.get_authorization_url()
    return {"url": url}


@app.post("/discord")
async def add_discord_data_to_db(user_id: int, code: str):
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


@app.post("/share")
async def share(user_id, url_id, descr):
    user = crud.user.get(user_id)
    url = crud.url.get(url_id)
    url_user = crud.url_user.get(user_id, url_id)

    if user.discord_id is None:
        raise HTTPException(
            status_code=404,
            detail=f"The user {user_id} has not linked their discord account",
        )
    else:
        send_message(message=descr, url=url.url, user=user)

    url_user.share = True
    crud.url_user.update(url_user)
    return {"success": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
