from typing import List
from api import models, crud
from api.auth.auth_bearer import JWTBearer
from db import get_session
from fastapi import Depends, HTTPException, Query, APIRouter
from sqlalchemy.orm import Session

router = APIRouter()

# RM NOTE - I'm commenting this out because I don't think we'll need it. If we do, we can uncomment it.
# creates the user with the given email
# @router.post("/users/", response_model=models.UserRead)
# def create_user(user: models.UserCreate):

#     # check to see if the user already exists
#     user_db = crud.user.where(dict(email=user.email))
#     if user_db:
#         raise HTTPException(status_code=200, detail="Email already registered")

#     # create the user
#     user_created = crud.user.create(user)

#     return user_created


# NOTE: RM - I'm commenting this endpoint out because it doesn't look like we'll need it. If we do, we can uncomment it. I believe all this does is return a list of users, but we don't need that.
# @router.get("/users/", response_model=List[models.UserRead])
# def read_users(
#     offset: int = 0, limit: int = Query(default=100, lte=500),
# ):
#     users = crud.user.get_multi(offset, limit)
#     return users

# TODO: YOU ARE HERE! You have succesfully added the JWTBearer as a dependency to this route, now you need to add it to the other endpoints, and test it. You have also been able to test this endpoint using the swagger api and the authenticate and lock thing that makes you manually put the JWT in. It works! Now you need to add it to the other endpoints and test it.
@router.get("/users/{user_id}", dependencies=[Depends(JWTBearer())], response_model=models.UserReadWithUrls)
def read_user_with_urls(*, session: Session = Depends(get_session), user_id: int):
    user = session.get(models.User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
