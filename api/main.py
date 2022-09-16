from typing import List
import models, crud
from db import create_db_and_tables, get_session
from sonyflake import SonyFlake

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

id_generator = SonyFlake()

app = FastAPI()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.post("/users/", response_model=models.UserRead)
def create_user(user: models.UserCreate):
    user.id = id_generator.next_id()
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
    return user


@app.post("/url/", response_model=models.UrlRead)
def create_url(*, session: Session = Depends(get_session), url: models.UrlCreate):
    # Get tags
    tags = url.tags
    del url.tags

    # Create url
    url_created = crud.url.create(url)

    # Create tags
    for tag in tags:
        tag = models.TagCreate(name=tag, url_id=url_created.id)
        _ = crud.tag.create(tag)

    # Get created url
    url_created = session.get(models.Url, url_created.id)
    return url_created


@app.post("/tags/", response_model=models.TagRead)
def create_tags(tag: models.TagCreate):
    tag_created = crud.tag.create(tag)
    return tag_created
