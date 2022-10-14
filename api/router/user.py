from typing import List
from api import models, crud
from db import get_session
from fastapi import Depends, HTTPException, Query, APIRouter
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/users/", response_model=models.UserRead)
def create_user(user: models.UserCreate):
    user_created = crud.user.create(user)
    return user_created


@router.get("/users/", response_model=List[models.UserRead])
def read_users(
    offset: int = 0, limit: int = Query(default=100, lte=500),
):
    users = crud.user.get_multi(offset, limit)
    return users


@router.get("/users/{user_id}", response_model=models.UserReadWithUrls)
def read_user(*, session: Session = Depends(get_session), user_id: int):
    user = session.get(models.User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
