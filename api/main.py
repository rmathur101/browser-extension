from typing import List
from api import models, crud, utils
from db import create_db_and_tables, get_session
from sonyflake import SonyFlake
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

id_generator = SonyFlake()

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


@app.post("/url/")
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
    return url_user_created


# @app.post("/tags/", response_model=models.TagRead)
# def create_tags(tag: models.TagCreate):
#     tag_created = crud.tag.create(tag)
#     return tag_created
