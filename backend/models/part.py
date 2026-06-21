"""Part ORM model — represents a single detectable component."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Index

from database import Base


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    part_name = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True, default="")
    status = Column(String(20), nullable=False, default="active")  # "active" | "inactive"
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    __table_args__ = (
        Index("ix_parts_status", "status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "part_name": self.part_name,
            "description": self.description or "",
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
