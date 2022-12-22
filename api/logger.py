from loguru import logger
import sys

# adding logger config
logger.add("logs/log.json", format="Log {level} at {time} has message: {message}", serialize=True)
logger.add(sys.stdout, format="Log {level} at {time} has message: {message}. Extra data: \n{extra}", serialize=False)