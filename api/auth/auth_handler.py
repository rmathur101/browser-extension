import time
import jwt
import dotenv

# Get env variables
config = dotenv.dotenv_values()
JWT_SECRET = config["JWT_SECRET"]
JWT_ALGORITHM = config["JWT_ALGO"]

def signJWT(user_id: int, discord_id: int) -> str:
    payload = {
        "user_id": user_id,
        "discord_id": discord_id,
        "expires": time.time() + 2592000 # 30 days
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return token
  
def decodeJWT(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return None 