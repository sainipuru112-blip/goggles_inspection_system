"""ModelPart association table — links models to their component parts."""

from sqlalchemy import Column, Integer, ForeignKey, Table

from database import Base


class ModelPart(Base):
    __tablename__ = "model_parts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("models.id", ondelete="CASCADE"), nullable=False)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
