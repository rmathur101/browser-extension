from api import models
from sqlmodel import Session, SQLModel, create_engine
from dotenv import dotenv_values

config = dotenv_values()

POSTGRES_SQLALCHEMY_URI = f'postgresql://{config["PG_USER"]}:{config["PG_PASSWORD"]}@{config["PG_HOST"]}:5432/{config["PG_DATABASE"]}'
engine = create_engine(POSTGRES_SQLALCHEMY_URI)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# sqlite_file_name = "database_2.db"
# sqlite_url = f"sqlite:///{sqlite_file_name}"

# connect_args = {"check_same_thread": False}
# engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)
