import dotenv
config = dotenv.dotenv_values()
DEBUG = config["DATA_DIR"]

# RM: This is to allow debugging in VSCode, I have to use it in my case, and Josca doesn't, I would guess because I'm not able to have multiple things listening on the same port because I'm running local development
if DEBUG == "True":
    import ptvsd
    ptvsd.enable_attach(address=('127.0.0.1', 4000))
    ptvsd.wait_for_attach()

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from api.router import url_user
from router import user, discord


app = FastAPI()

app.include_router(url_user.router)
app.include_router(user.router)
app.include_router(discord.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
