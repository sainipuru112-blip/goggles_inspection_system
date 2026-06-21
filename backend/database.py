"""
Database engine, session factory, and Base for ORM models.

Uses async SQLAlchemy with aiosqlite for non-blocking DB access.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from config import DATABASE_URL

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables (idempotent)."""
    async with engine.begin() as conn:
        from models import part, model, model_part, history  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
