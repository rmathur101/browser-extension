import requests
from discord import SyncWebhook


webhook = SyncWebhook.from_url(
    "https://discord.com/api/webhooks/1023123594190000200/s9P3Rd-h2lx2QR-3pZA4dI5aZKgbG73HuznzeGwOYf8FqN7u3h62hjxZdyVsd9SHsH-m"
)


def send_message(message, url, username, avatar_url):
    if avatar_url:
        webhook.send(f"{message} {url}", username=username, avatar_url=avatar_url)
    else:
        webhook.send(f"{message} {url}", username=username, avatar_url=avatar_url)
