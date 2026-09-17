"""SQLAlchemy engine/session setup.

A single `engine`/`SessionLocal` pair bound to `settings.database_url`.
`get_db` is the FastAPI dependency every route uses to get a request-scoped
session; tests override it to bind to a shared transactional connection.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
