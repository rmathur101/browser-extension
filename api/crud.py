from operator import or_
from typing import Generic, Type, TypeVar, List
from sqlmodel import SQLModel, Session, select, delete, update, and_
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.future import Engine
from api import models
from api.models import User, UrlUser, Url, Tag
from api.db import engine


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

    def create(self, model_obj: ModelType) -> ModelType:
        with Session(self.engine) as session:
            db_model = self.model.from_orm(model_obj)
            session.add(db_model)
            session.commit()
            session.refresh(db_model)
            return db_model

    def update(self, model_obj: ModelType) -> ModelType:
        model_update = model_obj.dict(exclude_unset=True)
        with Session(self.engine) as session, session.begin():
            statement = update(self.model).where(self.model.id == model_obj.id)
            session.exec(statement.values(**model_update))
        return self.get(model_obj.id)

    def delete(self, id) -> None:
        with Session(self.engine) as session, session.begin():
            statement = delete(self.model).where(self.model.id == id)
            session.exec(statement)

    def insert_if_not_exists(self, model_obj: Url) -> None:
        model_update = model_obj.dict(exclude_unset=True)
        with Session(self.engine) as session, session.begin():
            statement = (
                pg_insert(self.model)
                .values(**model_update)
                .on_conflict_do_nothing(index_elements=["id"])
            )
            session.exec(statement)

    def where(self, equals: dict = {}) -> List[ModelType]:
        with Session(self.engine) as session:
            return session.exec(
                select(self.model).where(
                    and_(*[getattr(self.model, k) == v for k, v in equals.items()])
                )
            ).all()


class CRUDUrlUser(CRUDBase[UrlUser, Engine]):
    def get(self, user_id: int, url_id: int) -> models.UrlUser:
        with Session(self.engine) as session:
            statement = select(self.model).where(
                and_(self.model.user_id == user_id, self.model.url_id == url_id,)
            )
            return session.exec(statement).one_or_none()

    def update(self, model_obj: models.UrlUser) -> None:
        model_update = model_obj.dict(exclude_unset=True)
        with Session(self.engine) as session, session.begin():
            statement = update(self.model).where(
                and_(
                    self.model.user_id == model_obj.user_id,
                    self.model.url_id == model_obj.url_id,
                )
            )
            session.exec(statement.values(**model_update))
        return self.get(user_id=model_obj.user_id, url_id=model_obj.url_id)

    def upsert(self, model_obj: models.UrlUser):
        model_update = model_obj.dict(exclude_unset=True)
        with Session(self.engine) as session, session.begin():
            statement = (
                pg_insert(self.model)
                .values(**model_update)
                .on_conflict_do_update(
                    index_elements=["user_id", "url_id"], set_=model_update
                )
            )
            session.exec(statement)
        return self.get(user_id=model_obj.user_id, url_id=model_obj.url_id)

    def _update_user_for_discord_urls(self, discord_user_id: int, user_id: int) -> None:
        with Session(self.engine) as session, session.begin():
            statement = (
                update(self.model)
                .where(self.model.user_id == discord_user_id)
                .values(user_id=user_id)
            )
            session.exec(statement)


class CRUDTag(CRUDBase[Tag, Engine]):
    def get_url_user_tags(self, user_id: int, url_id: int):
        with Session(self.engine) as session:
            statement = select(self.model).where(
                and_(self.model.user_id == user_id, self.model.url_id == url_id,)
            )
            return session.exec(statement).all()


class CRUDUser(CRUDBase[User, Engine]):
    def get_by_discord_id(self, discord_id: int):
        with Session(self.engine) as session:
            statement = select(self.model).where(self.model.discord_id == discord_id)
            return session.exec(statement).one_or_none()


class CRUDUrl(CRUDBase[Url, Engine]):
    ...


url_user = CRUDUrlUser(UrlUser, engine)
url = CRUDUrl(Url, engine)
user = CRUDUser(User, engine)
tag = CRUDTag(Tag, engine)
