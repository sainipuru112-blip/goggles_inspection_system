"""
Parts CRUD API — create, read, update, delete parts.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.part import Part

router = APIRouter(prefix="/api/parts", tags=["Parts"])


# ── Pydantic Schemas ──────────────────────────────────
class PartCreate(BaseModel):
    part_name: str
    description: Optional[str] = ""

class PartUpdate(BaseModel):
    part_name: Optional[str] = None
    description: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str  # "active" | "inactive"


# ── Endpoints ─────────────────────────────────────────

@router.get("")
async def list_parts(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all parts with optional search and pagination."""
    query = select(Part)
    count_query = select(func.count(Part.id))

    if search:
        query = query.where(Part.part_name.ilike(f"%{search}%"))
        count_query = count_query.where(Part.part_name.ilike(f"%{search}%"))
    if status:
        query = query.where(Part.status == status)
        count_query = count_query.where(Part.status == status)

    query = query.order_by(Part.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    parts = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    return {
        "items": [p.to_dict() for p in parts],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", status_code=201)
async def create_part(body: PartCreate, db: AsyncSession = Depends(get_db)):
    """Create a new part."""
    # Check duplicate
    existing = await db.execute(select(Part).where(Part.part_name == body.part_name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Part name already exists")

    part = Part(part_name=body.part_name, description=body.description or "")
    db.add(part)
    await db.commit()
    await db.refresh(part)
    return part.to_dict()


@router.put("/{part_id}")
async def update_part(part_id: int, body: PartUpdate, db: AsyncSession = Depends(get_db)):
    """Update a part."""
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    if body.part_name is not None:
        # Check duplicate name
        dup = await db.execute(
            select(Part).where(Part.part_name == body.part_name, Part.id != part_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Part name already exists")
        part.part_name = body.part_name
    if body.description is not None:
        part.description = body.description

    await db.commit()
    await db.refresh(part)
    return part.to_dict()


@router.delete("/{part_id}")
async def delete_part(part_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a part."""
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    await db.delete(part)
    await db.commit()
    return {"detail": "Part deleted"}


@router.patch("/{part_id}/status")
async def toggle_part_status(part_id: int, body: StatusUpdate, db: AsyncSession = Depends(get_db)):
    """Toggle part active/inactive status."""
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    part.status = body.status
    await db.commit()
    await db.refresh(part)
    return part.to_dict()
