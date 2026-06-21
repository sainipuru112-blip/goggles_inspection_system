"""History ORM model — records every inspection cycle."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index

from database import Base


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.now, index=True)
    model_name = Column(String(120), nullable=False)
    result = Column(String(10), nullable=False)  # "OK" | "NG"
    snapshot_path = Column(String(500), nullable=True)
    cycle_time = Column(Float, nullable=True, default=0.0)
    ok_parts = Column(Text, nullable=True, default="[]")  # JSON list
    ng_parts = Column(Text, nullable=True, default="[]")  # JSON list

    __table_args__ = (
        Index("ix_history_result", "result"),
        Index("ix_history_model", "model_name"),
    )

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "model_name": self.model_name,
            "result": self.result,
            "snapshot_path": self.snapshot_path or "",
            "cycle_time": round(self.cycle_time, 3) if self.cycle_time else 0.0,
            "ok_parts": json.loads(self.ok_parts) if self.ok_parts else [],
            "ng_parts": json.loads(self.ng_parts) if self.ng_parts else [],
            "ok_count": len(json.loads(self.ok_parts)) if self.ok_parts else 0,
            "ng_count": len(json.loads(self.ng_parts)) if self.ng_parts else 0,
        }
