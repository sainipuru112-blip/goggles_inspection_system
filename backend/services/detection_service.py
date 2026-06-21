"""
Detection Service — orchestrates the detection loop and history recording.
"""

import json
import time
from datetime import datetime

from database import AsyncSessionLocal
from models.history import History
from utils.snapshot import save_snapshot


async def record_inspection(
    model_name: str,
    result: str,
    cycle_time: float,
    ok_parts: list,
    ng_parts: list,
    snapshot_path: str = None,
):
    """Record an inspection cycle to the history database."""
    async with AsyncSessionLocal() as session:
        record = History(
            timestamp=datetime.now(),
            model_name=model_name,
            result=result,
            snapshot_path=snapshot_path or "",
            cycle_time=cycle_time,
            ok_parts=json.dumps(ok_parts),
            ng_parts=json.dumps(ng_parts),
        )
        session.add(record)
        await session.commit()
        return record.id
