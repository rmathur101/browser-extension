from typing import List
from api import models, crud, utils
from db import get_session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from api.discord_utils import send_message

router = APIRouter()
UPDATE_FIELDS = (
    "user_descr",
    "rating",
    "custom_title",
    "metadata_descr",
    "document_title",
    "bookmark",
)


@router.post("/urluser/", response_model=models.UrlUserRead)
def create_url_user(
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
            status_code=200,
            detail=f"The url {url_str} already exists for user {url_user.user_id}",
        )

    # # Create tags
    tags_created = []
    for tag in tags:
        tag_db = create_tag(tag, url_id, user_id=url_user.user_id)
        tags_created.append(models.TagCreate(**tag_db.dict()))

    # Get created url
    url_user_created = crud.url_user.get(user_id=url_user.user_id, url_id=url_id)
    url_user_created = models.UrlUserRead(
        url=models.UrlRead(url=url_str), tags=tags_created, **url_user_created.dict()
    )

    # Check if url should be shared. And if so share to discord.
    if url_user.share:
        user = crud.user.get(url_user.user_id)
        share_url_to_discord(user, url, url_user.user_descr)

    return url_user_created


@router.post("/urluser/{url_id}", response_model=models.UrlUserRead)
async def update_delete_url_user(url_id, url_user: models.UrlUserUpdateApi):
    url_user = models.UrlUserUpdate(url_id=url_id, **url_user.dict())

    # Check if url metadata should be updated and if so update it.
    url_user_db = crud.url_user.get(user_id=url_user.user_id, url_id=url_id)
    url_user_update = url_user.dict(exclude_unset=True)
    if not url_user_update.keys().isdisjoint(UPDATE_FIELDS):
        url_user_update = url_user_db.copy(update=url_user_update)
        url_user_updated = crud.url_user.update(url_user_update)
    else:
        url_user_updated = url_user_db

    # Check if url should be shared. And if so share to discord.
    if url_user.share == True:
        user = crud.user.get(url_user.user_id)
        url = crud.url.get(url_id)
        share_url_to_discord(user, url, url_user_updated.user_descr)

    # check if tags should be updated
    if url_user.tags:
        tags_updated = update_tags(tags=url_user.tags, url_user=url_user_updated)
    else:
        tags_updated = crud.tag.get_url_user_tags(
            url_id=url_user_updated.url_id, user_id=url_user_updated.user_id
        )

    url_user_updated = models.UrlUserRead(tags=tags_updated, **url_user_updated.dict())

    return url_user_updated


# FIXME: I dont think this is working, Test out when debugging. Also keep all
# arguments in body
@router.get("/urluser/{url_id}", response_model=models.UrlUserRead)
async def read_url_user(*, session: Session = Depends(get_session), url_id: int):
    url_user = session.get(models.UrlUser, url_id)
    if url_user is None:
        raise HTTPException(status_code=404, detail="Url not found")
    return url_user


def share_url_to_discord(user, url, descr):
    if user.discord_id is None:
        raise HTTPException(
            status_code=404,
            detail=f"The user {user.id} has not linked their discord account",
        )
    else:
        send_message(message=descr, url=url.url, user=user)


def create_tag(tag, url_id, user_id):
    tag_id = utils.str2int(tag)
    tag_obj = models.TagCreate(id=tag_id, name=tag, url_id=url_id, user_id=user_id)
    tag_db = crud.tag.create(tag_obj)
    return tag_db


def update_tags(tags, url_user):
    tags = set(tags)
    tags_db = crud.tag.get_url_user_tags(
        url_id=url_user.url_id, user_id=url_user.user_id
    )
    tags_db = set(tag.name for tag in tags)

    tags_create = tags - tags_db
    tags_delete = tags_db - tags

    if tags_create:
        for tag in tags_create:
            create_tag(tag, url_id=url_user.url_id, user_id=url_user.user_id)
    if tags_delete:
        for tag in tags_delete:
            tag_id = utils.str2int(tag)
            crud.tag.delete(id=tag_id)

    tags_updated = crud.tag.get_url_user_tags(
        url_id=url_user.url_id, user_id=url_user.user_id
    )
    return tags_updated
