import discord
from dotenv import dotenv_values
import json
from collections import defaultdict
from pathlib import Path
from cache import AsyncTTL
from discord.ext import tasks, commands


config = dotenv_values()

intents = discord.Intents.default()
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    dump_metadata_threads.start()


@tasks.loop(seconds=60*60)
async def dump_metadata_threads():
    server = client.get_guild(int(config["SERVER_ID"]))

    ### Get relevant channel and thread metadata for server ###

    # c.type.value == 0 is a text channel
    channels = [c for c in server.channels if c.type.value == 0]
    threads = []
    channels_metadata = []
    for channel in channels:
        for thread in channel.threads:
            threads.append(
                {
                    "name": thread.name,
                    "id": thread.id,
                    "active": False if thread.archived else True,
                }
            )
        channels_metadata.append(
            {"name": channel.name, "id": channel.id, "threads": threads}
        )

    with open(Path(config["DATA_DIR"]) / "metadata" / "server_metadata.json", "w") as f:
        json.dump(channels_metadata, f)


client.run(config["BOT_TOKEN"])

