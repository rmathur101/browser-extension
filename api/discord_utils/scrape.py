from pathlib import Path
import json
from typing import List
import pandas as pd
import regex as re
from pathlib import Path
from datetime import date, timedelta, datetime
import subprocess
from dotenv import dotenv_values
import json
from api import crud, models, utils

config = dotenv_values()
DATA_DIR = Path(config["DATA_DIR"])

BOT_TOKEN = config["BOT_TOKEN"]


def discord2db():
    with open(DATA_DIR / "metadata" / "server_metadata.json", "r") as f:
        channels = json.load(f)

    discord2json(channels)
    # json2db()


def discord2json(channels):
    def _scrape_channel(channel_id, lookback_days=7):
        today = date.today()
        a_week_earlier = today - timedelta(days=lookback_days)
        messages_dir = DATA_DIR / "raw_message_data"

        cmd = " ".join(
            [
                "dotnet /root/programs/discordchatexporter/DiscordChatExporter.Cli.dll export",
                f"-c {channel_id}",
                f"-t {BOT_TOKEN}",
                f"-o {str(messages_dir / str(today))}",
                f"--after {a_week_earlier}",
                "-f Json",
                '--dateformat "dd/MM/yyyy HH:mm"',
            ]
        )
        subprocess.run([cmd], shell=True)

    for channel in channels:
        _scrape_channel(channel["id"])
        for thread in channel["threads"]:
            _scrape_channel(thread["id"])

    print(f"Discord server was scraped at: {datetime.now()}")


def json2db():
    dirs_sorted_by_time = sorted(
        [(folder, folder.name) for folder in (DATA_DIR / "raw_message_data").iterdir()],
        key=lambda x: x[1],
    )
    latest_data_dir = dirs_sorted_by_time[-1][0]
    for fp in Path(latest_data_dir).iterdir():
        with fp.open() as f:
            channel = json.load(f)

        upsert_channel_messages_with_urls(channel)


def upsert_channel_messages_with_urls(channel):
    for msg in channel["messages"]:
        msg_urls = extract_urls_from_msg(msg)

        if msg_urls:
            author = msg["author"]
            user = crud.user.get_by_discord_id(int(author["id"]))
            if not user:
                user = models.UserCreate(
                    email="discord_only",
                    discord_id=int(author["id"]),
                    discord_username=author["name"],
                )
                user = crud.user.create(user)

            upsert_url(user, channel, msg, msg_urls)

        else:
            continue


def extract_urls_from_msg(msg):
    URL = re.compile(
        "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
    )
    msg_urls = URL.findall(msg["content"])
    return msg_urls


def upsert_url(user, channel, msg, msg_urls):

    for msg_url in msg_urls:
        # Get url and create if not exists
        url_id = utils.str2int(msg_url)
        url = models.UrlCreate(id=url_id, url=msg_url)
        crud.url.insert_if_not_exists(url)

        # Upsert url
        url_user = models.UrlUser(
            user_id=user.id,
            url_id=url_id,
            created_at=pd.to_datetime(msg["timestamp"]),
            user_descr=msg["content"],
            discord_msg_id=msg["id"],
            discord_channel_id=channel["id"],
            discord_reactions=sum([reaction["count"] for reaction in msg["reactions"]]),
        )
        crud.url_user.upsert(url_user)


if __name__ == "__main__":
    # discord2db()
    json2db()
