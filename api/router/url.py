

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