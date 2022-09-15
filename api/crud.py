from typing import Generic, Type, TypeVar, List
from sqlmodel import SQLModel, Session, select, delete, update
from sqlalchemy.future import Engine
from models import User, Bookmark, Tag
from db import engine


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


class CRUDUser(CRUDBase[User, Engine]):
    ...


class CRUDBookmark(CRUDBase[Bookmark, Engine]):
    ...


class CRUDBookmark(CRUDBase[Bookmark, Engine]):
    ...


bookmark = CRUDBookmark(Bookmark, engine)
user = CRUDUser(User, engine)
tag = CRUDUser(Tag, engine)
