"""
History API — list, filter, export inspection records.
"""

import csv
import io
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast, Date
from typing import Optional

from database import get_db
from models.history import History

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("")
async def list_history(
    search: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),  # ISO format: 2024-01-01
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List history records with filters and pagination."""
    query = select(History)
    count_query = select(func.count(History.id))

    filters = []
    if search:
        filters.append(History.model_name.ilike(f"%{search}%"))
    if model_name:
        filters.append(History.model_name == model_name)
    if result:
        filters.append(History.result == result.upper())
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            filters.append(History.timestamp >= dt)
        except ValueError:
            pass
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to) + timedelta(days=1)
            filters.append(History.timestamp < dt)
        except ValueError:
            pass

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    query = query.order_by(History.timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = await db.execute(query)
    items = rows.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    return {
        "items": [h.to_dict() for h in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/stats")
async def get_stats(
    date: Optional[str] = Query(None, description="Date in ISO format (YYYY-MM-DD). Defaults to today."),
    start_time: Optional[str] = Query(None, description="Start date/time in ISO format"),
    end_time: Optional[str] = Query(None, description="End date/time in ISO format"),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated stats for the dashboard. Optionally filter by date or start_time/end_time range."""
    if start_time:
        try:
            today_start = datetime.fromisoformat(start_time)
        except ValueError:
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    elif date:
        try:
            today_start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    if end_time:
        try:
            day_end = datetime.fromisoformat(end_time)
        except ValueError:
            day_end = today_start + timedelta(days=1)
    else:
        day_end = today_start + timedelta(days=1)

    # Total cycles for selected range
    today_count = await db.execute(
        select(func.count(History.id)).where(and_(History.timestamp >= today_start, History.timestamp <= day_end))
    )
    todays_cycles = today_count.scalar() or 0

    # OK/NG counts for selected range
    ok_count_q = await db.execute(
        select(func.count(History.id)).where(
            and_(History.timestamp >= today_start, History.timestamp <= day_end, History.result == "OK")
        )
    )
    ok_today = ok_count_q.scalar() or 0

    ng_count_q = await db.execute(
        select(func.count(History.id)).where(
            and_(History.timestamp >= today_start, History.timestamp <= day_end, History.result == "NG")
        )
    )
    ng_today = ng_count_q.scalar() or 0

    # All time totals
    total_ok = await db.execute(select(func.count(History.id)).where(History.result == "OK"))
    total_ng = await db.execute(select(func.count(History.id)).where(History.result == "NG"))
    total_ok_val = total_ok.scalar() or 0
    total_ng_val = total_ng.scalar() or 0

    total_all = total_ok_val + total_ng_val
    accuracy = round((total_ok_val / total_all * 100), 1) if total_all > 0 else 0.0

    # Hourly or daily breakdown for selected range
    hourly_data = []
    duration = day_end - today_start
    if duration <= timedelta(days=1.5):
        # Align to hour boundaries for bins
        start_aligned = today_start.replace(minute=0, second=0, microsecond=0)
        curr = start_aligned
        while curr <= day_end:
            next_hour = curr + timedelta(hours=1)
            q_start = max(curr, today_start)
            q_end = min(next_hour, day_end)
            if q_start < q_end:
                h_ok = await db.execute(
                    select(func.count(History.id)).where(
                        and_(History.timestamp >= q_start, History.timestamp < q_end, History.result == "OK")
                    )
                )
                h_ng = await db.execute(
                    select(func.count(History.id)).where(
                        and_(History.timestamp >= q_start, History.timestamp < q_end, History.result == "NG")
                    )
                )
                hourly_data.append({
                    "hour": curr.strftime("%H:%M"),
                    "ok": h_ok.scalar() or 0,
                    "ng": h_ng.scalar() or 0,
                })
            curr = next_hour
    else:
        # Spans multiple days: daily breakdown
        curr = today_start.replace(hour=0, minute=0, second=0, microsecond=0)
        while curr <= day_end:
            next_day = curr + timedelta(days=1)
            q_start = max(curr, today_start)
            q_end = min(next_day, day_end)
            if q_start < q_end:
                d_ok = await db.execute(
                    select(func.count(History.id)).where(
                        and_(History.timestamp >= q_start, History.timestamp < q_end, History.result == "OK")
                    )
                )
                d_ng = await db.execute(
                    select(func.count(History.id)).where(
                        and_(History.timestamp >= q_start, History.timestamp < q_end, History.result == "NG")
                    )
                )
                hourly_data.append({
                    "hour": curr.strftime("%b %d"),
                    "ok": d_ok.scalar() or 0,
                    "ng": d_ng.scalar() or 0,
                })
            curr = next_day

    # Daily trend (last 7 days leading up to day_end)
    trend_data = []
    for i in range(6, -1, -1):
        day = (day_end - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end_trend = day + timedelta(days=1)

        d_ok = await db.execute(
            select(func.count(History.id)).where(
                and_(History.timestamp >= day, History.timestamp < day_end_trend, History.result == "OK")
            )
        )
        d_ng = await db.execute(
            select(func.count(History.id)).where(
                and_(History.timestamp >= day, History.timestamp < day_end_trend, History.result == "NG")
            )
        )
        trend_data.append({
            "date": day.strftime("%b %d"),
            "ok": d_ok.scalar() or 0,
            "ng": d_ng.scalar() or 0,
        })

    # Recent detections for the selected range
    recent_q = await db.execute(
        select(History).where(
            and_(History.timestamp >= today_start, History.timestamp <= day_end)
        ).order_by(History.timestamp.desc()).limit(10)
    )
    recent = [h.to_dict() for h in recent_q.scalars().all()]

    # Latest snapshot
    latest_snap = await db.execute(
        select(History).where(History.snapshot_path.isnot(None)).order_by(History.timestamp.desc()).limit(1)
    )
    latest_snap_row = latest_snap.scalar_one_or_none()

    return {
        "selected_date": today_start.strftime("%Y-%m-%d"),
        "start_time": today_start.isoformat(),
        "end_time": day_end.isoformat(),
        "todays_cycles": todays_cycles,
        "ok_today": ok_today,
        "ng_today": ng_today,
        "total_ok": total_ok_val,
        "total_ng": total_ng_val,
        "accuracy": accuracy,
        "hourly_data": hourly_data,
        "trend_data": trend_data,
        "recent": recent,
        "latest_snapshot": latest_snap_row.snapshot_path if latest_snap_row else None,
    }


@router.get("/export/csv")
async def export_csv(
    model_name: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Export history records as CSV."""
    query = select(History)
    filters = []

    if model_name:
        filters.append(History.model_name == model_name)
    if result:
        filters.append(History.result == result.upper())
    if date_from:
        try:
            filters.append(History.timestamp >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            filters.append(History.timestamp < datetime.fromisoformat(date_to) + timedelta(days=1))
        except ValueError:
            pass

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(History.timestamp.desc())
    rows = await db.execute(query)
    items = rows.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Cycle ID", "Timestamp", "Model Name", "Result", "OK Count", "NG Count", "Cycle Time", "OK Parts", "NG Parts"])

    for h in items:
        d = h.to_dict()
        writer.writerow([
            d["id"],
            d["timestamp"],
            d["model_name"],
            d["result"],
            d["ok_count"],
            d["ng_count"],
            d["cycle_time"],
            ", ".join(d["ok_parts"]),
            ", ".join(d["ng_parts"]),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inspection_history.csv"},
    )


@router.get("/{history_id}")
async def get_history_detail(history_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single history record."""
    result = await db.execute(select(History).where(History.id == history_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record.to_dict()
