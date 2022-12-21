from typing import List
from api import models, crud, utils
from db import get_session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from api.discord_utils import discord_send_message

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
    url_title = url_user.url_title
    url_id = utils.str2int(url_str)
    url = models.UrlCreate(id=url_id, url=url_str, title=url_title)
    crud.url.insert_if_not_exists(url)
    del url_user.url_title, url_user.url

    # Get tags
    tags = url_user.tags
    del url_user.tags

    # Create url
    url_user.url_id = url_id
    url_user_created = crud.url_user.upsert(url_user)

    # # Create tags
    tags_created = []
    if tags:
        for tag in tags:
            tag_db = create_tag(tag, url_id, user_id=url_user.user_id)
            tags_created.append(models.TagCreate(**tag_db.dict()))

    # Get created url
    url_user_created = crud.url_user.get(user_id=url_user.user_id, url_id=url_id)
    url_user_created = models.UrlUserRead(
        url=models.UrlRead(url=url_str, title=url_title),
        tags=tags_created,
        **url_user_created.dict(),
    )

    # Check if url should be shared. And if so share to discord.
    if url_user.share:
        user = crud.user.get(url_user.user_id)
        share_url_to_discord(
            user=user, url=url, descr=url_user.user_descr, channel_id=url_user.share,
        )

    return url_user_created


@router.post("/urluser/{url_id}", response_model=models.UrlUserRead)
async def update_delete_url_user(url_id, url_user: models.UrlUserUpdateApi):
    url_user = models.UrlUserUpdate(url_id=url_id, **url_user.dict(exclude_unset=True))

    # Get tags
    tags = url_user.tags
    del url_user.tags

    # Check if url metadata should be updated and if so update it.
    url_user_db = crud.url_user.get(user_id=url_user.user_id, url_id=url_id)
    if url_user_db is None:
        raise HTTPException(
            status_code=404,
            detail=f"The url {url_id} does not exist for user {url_user.user_id}",
        )

    url_user_update = url_user.dict(exclude_unset=True)
    if not url_user_update.keys().isdisjoint(UPDATE_FIELDS):
        url_user_update = url_user_db.copy(update=url_user_update)
        url_user_updated = crud.url_user.update(url_user_update)
    else:
        url_user_updated = url_user_db

    # Check if url should be shared. And if so share to discord.
    if url_user.share:
        user = crud.user.get(url_user.user_id)
        url = crud.url.get(url_id)
        share_url_to_discord(
            user=user,
            url=url,
            descr=url_user_updated.user_descr,
            channel_id=url_user.share,
        )

    # check if tags should be updated
    if tags:
        tags_updated = update_tags(tags=tags, url_user=url_user_updated)
    else:
        tags_updated = crud.tag.get_url_user_tags(
            url_id=url_user_updated.url_id, user_id=url_user_updated.user_id
        )

    url_user_updated = models.UrlUserRead(tags=tags_updated, **url_user_updated.dict())

    return url_user_updated


# FIXME: I dont think this is working, Test out when debugging. Also keep all
# arguments in body
# NOTE: RM - I'm commenting this out for now, I'm not sure if we're going to need it, and it's one of the endpoints that may need to be modified to ensure that the response data doesn't violate any of the javascript bigint limitations. If we need it later we can uncomment it.
# @router.get("/urluser/{url_id}", response_model=models.UrlUserRead)
# async def read_url_user(*, session: Session = Depends(get_session), url_id: int):
#     url_user = session.get(models.UrlUser, url_id)
#     if url_user is None:
#         raise HTTPException(status_code=404, detail="Url not found")
#     return url_user


def share_url_to_discord(user, url, descr, channel_id):
    if user.discord_id is None:
        raise HTTPException(
            status_code=404,
            detail=f"The user {user.id} has not linked their discord account",
        )
    else:
        assert channel_id is not None, "A valid channel id must be provided"
        assert channel_id.isdigit(), "The channel id must be a valid number"

        message = f"{descr} {url.url}"
        discord_send_message(message=message, user=user, thread_id=int(channel_id))


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
    tags_db = set(tag.name for tag in tags_db)

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
