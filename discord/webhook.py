import requests
from discord import SyncWebhook


webhook = SyncWebhook.from_url(
    "https://discord.com/api/webhooks/1023123594190000200/s9P3Rd-h2lx2QR-3pZA4dI5aZKgbG73HuznzeGwOYf8FqN7u3h62hjxZdyVsd9SHsH-m"
)
webhook.send("Testing webhook", username="Josca")

