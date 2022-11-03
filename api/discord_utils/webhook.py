import requests

WEBHOOK_CHANNEL_ID = 1000691190074703905


def discord_send_message(message, user, thread_id):
    avatar_url = f"https://cdn.discordapp.com/avatars/{user.discord_id}/{user.discord_avatar}.png"
    if avatar_url.isdigit():
        if int(avatar_url) < 10000:
            avatar_url = (
                f"https://cdn.discordapp.com/embed/avatars/{user.discord_avatar}.png"
            )

    response = requests.post(
        "https://discord.com/api/webhooks/1023123594190000200/s9P3Rd-h2lx2QR-3pZA4dI5aZKgbG73HuznzeGwOYf8FqN7u3h62hjxZdyVsd9SHsH-m",
        data={
            "content": message,
            "username": user.discord_username,
            "avatar_url": avatar_url,
        },
        params={"thread_id": thread_id if thread_id != WEBHOOK_CHANNEL_ID else None},
    )
    return response
