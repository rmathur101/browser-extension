from pathlib import Path
import json
from typing import List
import pandas as pd
import regex as re
from pathlib import Path
from datetime import date, timedelta, datetime
import subprocess
from tqdm import tqdm
from dotenv import dotenv_values
import json

config = dotenv_values()
DATA_DIR = Path(config["DATA_DIR"])

BOT_TOKEN = config["BOT_TOKEN"]


def discord2db():
    with open(DATA_DIR / "metadata" / "channels.json", "r") as f:
        channels = json.load(f)
    with open(DATA_DIR / "metadata" / "threads.json", "r") as f:
        threads = json.load(f)

    discord2json(channels, threads)
    # json2db()


def discord2json(channels, threads):
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
        for thread in threads[str(channel["id"])]["active"]:
            _scrape_channel(thread["id"])

    print(f"Discord server was scraped at: {datetime.now()}")


# def json2db():

#     for folder in DATA_DIR.iterdir():
#         for fp in folder.iterdir():
#             with fp.open() as f:
#                 channel = json.load(f)

#             df_messages = parse_channel_data(channel)
#             links = detect_links(df_messages)

#             messages2db(df_messages)
#             links2db(links)


# def parse_channel_data(channel: dict) -> pd.DataFrame:
#     guild_id = int(channel["guild"]["id"])
#     channel_id = int(channel["channel"]["id"])

#     messages = []
#     for message in channel["messages"]:
#         message_type = message["type"]

#         messages.append(
#             dict(
#                 id=int(message["id"]),
#                 timestamp=message["timestamp"],
#                 content=message["content"],
#                 author=message["author"]["id"],
#                 reactions=sum([reaction["count"] for reaction in message["reactions"]]),
#                 guild_id=guild_id,
#                 channel_id=channel_id,
#                 message_type=message_type,
#                 reply_to_id=message["reference"]["messageId"]
#                 if message_type == "Reply"
#                 else None,
#             )
#         )

#     df_m = pd.DataFrame.from_dict(messages)
#     df_m["timestamp"] = pd.to_datetime(df_m["timestamp"])
#     return df_m


# def detect_links(df_m: pd.DataFrame) -> List[dict]:
#     URL = re.compile(
#         "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
#     )

#     urls = []
#     for idx, message in df_m.iterrows():
#         message_urls = URL.findall(message["content"])
#         for message_url in message_urls:
#             urls.append(dict(message_id=message["id"], url=message_url))

#     return urls


# def messages2db(df_messages: pd.DataFrame) -> None:
#     for idx, message in tqdm(df_messages.iterrows(), total=len(df_messages)):
#         crud.message.upsert(message.to_dict())


# def links2db(links: List[dict]):
#     for link in tqdm(links):
#         crud.link.upsert(link)


if __name__ == "__main__":
    discord2db()
    # json2db()
