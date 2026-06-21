"""
History Service — handles seeding demo data for dashboard visibility.
"""

import json
import random
from datetime import datetime, timedelta

from database import AsyncSessionLocal
from models.history import History


DEMO_MODELS = ["Roof Model", "Door Model", "Mirror Model", "Bumper Model", "Tail Lamp Model"]

DEMO_PARTS = {
    "Roof Model": ["Sunroof", "Roof Rail", "Antenna", "Roof Moulding"],
    "Door Model": ["Door Handle", "Quarter Glass", "Mirror", "Beltline"],
    "Mirror Model": ["Mirror"],
    "Bumper Model": ["Bumper"],
    "Tail Lamp Model": ["Tail Lamp", "Reflector", "Garnish"],
}


async def seed_demo_history(count: int = 150):
    """Seed the history table with realistic demo data for dashboard display."""
    async with AsyncSessionLocal() as session:
        # Check if history already has data
        from sqlalchemy import select, func
        existing = await session.execute(select(func.count(History.id)))
        if existing.scalar() > 0:
            return  # Already seeded

        now = datetime.now()
        records = []

        for i in range(count):
            model_name = random.choice(DEMO_MODELS)
            parts = DEMO_PARTS.get(model_name, [])

            # 85% OK rate
            is_ok = random.random() < 0.85
            if is_ok:
                ok_parts = parts
                ng_parts = []
                result = "OK"
            else:
                # Randomly miss 1-2 parts
                missed = random.sample(parts, min(random.randint(1, 2), len(parts)))
                ok_parts = [p for p in parts if p not in missed]
                ng_parts = missed
                result = "NG"

            # Spread over last 7 days
            timestamp = now - timedelta(
                days=random.randint(0, 6),
                hours=random.randint(6, 22),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59),
            )

            record = History(
                timestamp=timestamp,
                model_name=model_name,
                result=result,
                snapshot_path="",
                cycle_time=round(random.uniform(0.5, 3.5), 3),
                ok_parts=json.dumps(ok_parts),
                ng_parts=json.dumps(ng_parts),
            )
            records.append(record)

        session.add_all(records)
        await session.commit()
        print(f"[HistoryService] Seeded {count} demo history records")
