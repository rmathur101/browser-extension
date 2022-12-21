from typing import List
from api import models, crud
from db import get_session
from fastapi import Depends, HTTPException, Query, APIRouter
from sqlalchemy.orm import Session

router = APIRouter()


# creates the user with the given email
@router.post("/users/", response_model=models.UserRead)
def create_user(user: models.UserCreate):

    # check to see if the user already exists
    user_db = crud.user.where(dict(email=user.email))
    if user_db:
        raise HTTPException(status_code=200, detail="Email already registered")

    # create the user
    user_created = crud.user.create(user)

    return user_created


# NOTE: RM - I'm commenting this endpoint out because it doesn't look like we'll need it. If we do, we can uncomment it. I believe all this does is return a list of users, but we don't need that.
# @router.get("/users/", response_model=List[models.UserRead])
# def read_users(
#     offset: int = 0, limit: int = Query(default=100, lte=500),
# ):
#     users = crud.user.get_multi(offset, limit)
#     return users


@router.get("/users/{user_id}", response_model=models.UserReadWithUrls)
def read_user_with_urls(*, session: Session = Depends(get_session), user_id: int):
    user = session.get(models.User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
