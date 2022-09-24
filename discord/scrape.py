from pathlib import Path
import json
from typing import List
import pandas as pd
import regex as re
import os
from datetime import date, timedelta, datetime
import subprocess
from tqdm import tqdm

DISCORD_DATA_DIR = config["DISCORD_DATA_DIR"]
DISCORD_BOT_TOKEN = config["DISCORD_BOT_TOKEN"]


def discord2db():
    discord2json()
    json2db()


def discord2json():
    today = date.today()
    a_week_earlier = today - timedelta(days=30 * 9)

    cmd = " ".join(
        [
            "dotnet /root/downloads/DiscordChatExporter/DiscordChatExporter.Cli.dll export",
            "-c 986661887863312394",
            f"-t {DISCORD_BOT_TOKEN}",
            f"-o {str(DISCORD_DATA_DIR / str(today))}",
            f"--after {a_week_earlier}",
            "-f Json",
            '--dateformat "dd/MM/yyyy HH:mm"',
        ]
    )
    subprocess.run([cmd], shell=True)

    print(f"Discord server was scraped at: {datetime.now()}")


def json2db():

    for folder in DISCORD_DATA_DIR.iterdir():
        for fp in folder.iterdir():
            with fp.open() as f:
                channel = json.load(f)

            df_messages = parse_channel_data(channel)
            links = detect_links(df_messages)

            messages2db(df_messages)
            links2db(links)


def parse_channel_data(channel: dict) -> pd.DataFrame:
    guild_id = int(channel["guild"]["id"])
    channel_id = int(channel["channel"]["id"])

    messages = []
    for message in channel["messages"]:
        message_type = message["type"]

        messages.append(
            dict(
                id=int(message["id"]),
                timestamp=message["timestamp"],
                content=message["content"],
                author=message["author"]["id"],
                reactions=sum([reaction["count"] for reaction in message["reactions"]]),
                guild_id=guild_id,
                channel_id=channel_id,
                message_type=message_type,
                reply_to_id=message["reference"]["messageId"]
                if message_type == "Reply"
                else None,
            )
        )

    df_m = pd.DataFrame.from_dict(messages)
    df_m["timestamp"] = pd.to_datetime(df_m["timestamp"])
    return df_m


def detect_links(df_m: pd.DataFrame) -> List[dict]:
    URL = re.compile(
        "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
    )

    urls = []
    for idx, message in df_m.iterrows():
        message_urls = URL.findall(message["content"])
        for message_url in message_urls:
            urls.append(dict(message_id=message["id"], url=message_url))

    return urls


def messages2db(df_messages: pd.DataFrame) -> None:
    for idx, message in tqdm(df_messages.iterrows(), total=len(df_messages)):
        crud.message.upsert(message.to_dict())


def links2db(links: List[dict]):
    for link in tqdm(links):
        crud.link.upsert(link)


if __name__ == "__main__":
    discord2json()
    json2db()
