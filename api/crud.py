from typing import Generic, Type, TypeVar, List
from sqlmodel import SQLModel, Session, select, delete, update, and_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.future import Engine
from api.models import User, UrlUser, Url, Tag
from api.db import engine
from psycopg2.extras import execute_values

ModelType = TypeVar("ModelType", bound=SQLModel)
EngineType = TypeVar("EngineType", bound=Engine)


class CRUDBase(Generic[ModelType, EngineType]):
    def __init__(self, model: Type[ModelType], engine: Type[EngineType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A SQLModel class
        * `engine`: A sqlalchemy engine
        """
        self.model = model
        self.engine = engine

    def get(self, id) -> ModelType:
        with Session(self.engine) as session:
            return session.get(self.model, id)

    def get_multi(self, offset: int = 0, limit: int = 100) -> List[ModelType]:
        with Session(self.engine) as session:
            return session.exec(select(self.model).offset(offset).limit(limit)).all()

    def create(self, model_obj: ModelType) -> None:
        with Session(self.engine) as session:
            db_model = self.model.from_orm(model_obj)
            session.add(db_model)
            session.commit()
            session.refresh(db_model)
            return db_model

    def update(self, model_obj: ModelType) -> None:
        with Session(self.engine) as session, session.begin():
            statement = update(self.model).where(self.model.id == model_obj.id)
            session.exec(statement.values(**model_obj.dict()))
            return session.get(self.model, model_obj.id)

    def delete(self, id) -> None:
        with Session(self.engine) as session, session.begin():
            statement = delete(self.model).where(self.model.id == id)
            session.exec(statement)

    def insert_if_not_exists(self, model_obj: Url) -> None:
        with Session(self.engine) as session, session.begin():
            statement = (
                pg_insert(self.model)
                .values(**model_obj.dict())
                .on_conflict_do_nothing(index_elements=["id"])
            )
            session.exec(statement)


class CRUDUrlUser(CRUDBase[UrlUser, Engine]):
    def get(self, user_id: int, url_id: int):
        with Session(self.engine) as session:
            statement = select(self.model).where(
                and_(self.model.user_id == user_id, self.model.url_id == url_id,)
            )
            return session.exec(statement).one()


class CRUDUser(CRUDBase[User, Engine]):
    ...


class CRUDUrl(CRUDBase[Url, Engine]):
    ...


class CRUDTag(CRUDBase[Tag, Engine]):
    ...


url_user = CRUDUrlUser(UrlUser, engine)
url = CRUDUrl(Url, engine)
user = CRUDUser(User, engine)
tag = CRUDTag(Tag, engine)
