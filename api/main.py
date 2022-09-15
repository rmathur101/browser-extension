from typing import List
import models, crud
from db import create_db_and_tables, get_session

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session


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


@app.get("/users/{user_id}", response_model=models.UserReadWithBookmarks)
def read_user(*, session: Session = Depends(get_session), user_id: int):
    user = session.get(models.User, user_id)
    return user


@app.post("/bookmarks/", response_model=models.BookmarkRead)
def create_bookmark(bookmark: models.BookmarkCreate):
    bookmark_created = crud.bookmark.create(bookmark)
    return bookmark_created


@app.post("/tags/", response_model=models.TagRead)
def create_tags(tag: models.TagCreate):
    tag_created = crud.tag.create(tag)
    return tag_created
