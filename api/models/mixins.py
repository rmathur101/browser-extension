from sqlmodel import Field
from datetime import datetime
from sqlalchemy.orm import declarative_mixin


class Timestamp:
    created_at: datetime = Field(defaul=datetime.utcnow(), nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

