from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import declarative_mixin
from sqlalchemy import Column, DateTime


@declarative_mixin
class Timestamp(SQLModel):
    created_at: Optional[datetime] = Field(
        sa_column=Column(DateTime, default=datetime.utcnow, nullable=False)
    )
    updated_at: Optional[datetime] = Field(
        sa_column=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    )

