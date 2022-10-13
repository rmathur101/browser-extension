from fastapi import FastAPI
from api.router import url_user
from router import user, discord

app = FastAPI()

app.include_router(url_user.router)
app.include_router(user.router)
app.include_router(discord.router)
