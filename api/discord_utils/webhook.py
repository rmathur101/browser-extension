import requests
from discord import SyncWebhook
from api.models import User


webhook = SyncWebhook.from_url(
    "https://discord.com/api/webhooks/1023123594190000200/s9P3Rd-h2lx2QR-3pZA4dI5aZKgbG73HuznzeGwOYf8FqN7u3h62hjxZdyVsd9SHsH-m"
)


def send_message(message, url, user: User):
    avatar_url = f"https://cdn.discordapp.com/avatars/{user.discord_id}/{user.discord_avatar}.png"
    if avatar_url.isdigit():
        if int(avatar_url) < 10000:
            avatar_url = (
                f"https://cdn.discordapp.com/embed/avatars/{user.discord_avatar}.png"
            )

    webhook.send(
        f"{message} {url}", username=user.discord_username, avatar_url=avatar_url
    )
