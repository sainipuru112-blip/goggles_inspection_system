"""Model ORM model — represents a YOLO detection model configuration."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.orm import relationship

from database import Base


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(120), unique=True, nullable=False, index=True)
    model_path = Column(String(500), nullable=True, default="")
    status = Column(String(20), nullable=False, default="active")  # "active" | "inactive"
    created_at = Column(DateTime, nullable=False, default=datetime.now)

    # Relationship to parts via association table
    parts = relationship(
        "Part",
        secondary="model_parts",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_models_status", "status"),
    )

    def to_dict(self, include_parts=True):
        data = {
            "id": self.id,
            "model_name": self.model_name,
            "model_path": self.model_path or "",
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "parts_count": len(self.parts) if self.parts else 0,
        }
        if include_parts and self.parts:
            data["parts"] = [p.to_dict() for p in self.parts]
        else:
            data["parts"] = []
        return data
