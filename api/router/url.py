# from typing import List
# from api import models, crud
# from db import get_session
# from fastapi import Depends, HTTPException, Query, APIRouter
# from sqlalchemy.orm import Session

# router = APIRouter()


# @router.get("/urls/")
# def get_url_list(
#     sort_by: str = "recent", offset=0, limit: int = Query(default=100, lte=500)
# ):
#     ...


# @router.get("/urls/{url_id}")
# def get_url_stats(
#     offset: int = 0, limit: int = Query(default=100, lte=500),
# ):
#     url = crud.user.get_multi(offset, limit)

#     if url is None:
#         raise HTTPException(status_code=404, detail="User not found")

#     return users


# TODO: Add endpoint for getting url with relevant stats
# @router.get("/url/{url_id}", response_model=models.UrlUserRead)
# async def get_url_info(user_id, url_id, descr):
#     user = crud.user.get(user_id)
#     url = crud.url.get(url_id)
#     url_user = crud.url_user.get(user_id, url_id)
#     share_url_to_discord(user, url, descr)

#     url_user.share = True
#     crud.url_user.update(url_user)
#     return {"success": True}

# TODO add endpoint for getting top urls with relevant stats
