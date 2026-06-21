"""
Models CRUD API — manage detection models and their part assignments.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models.model import Model
from models.part import Part
from models.model_part import ModelPart

router = APIRouter(prefix="/api/models", tags=["Models"])


# ── Pydantic Schemas ──────────────────────────────────
class ModelCreate(BaseModel):
    model_name: str
    model_path: Optional[str] = ""
    part_ids: Optional[List[int]] = []

class ModelUpdate(BaseModel):
    model_name: Optional[str] = None
    model_path: Optional[str] = None
    part_ids: Optional[List[int]] = None

class StatusUpdate(BaseModel):
    status: str  # "active" | "inactive"

class PartAssignment(BaseModel):
    part_ids: List[int]


# ── Endpoints ─────────────────────────────────────────

@router.get("")
async def list_models(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all models with part counts."""
    query = select(Model)
    count_query = select(func.count(Model.id))

    if search:
        query = query.where(Model.model_name.ilike(f"%{search}%"))
        count_query = count_query.where(Model.model_name.ilike(f"%{search}%"))
    if status:
        query = query.where(Model.status == status)
        count_query = count_query.where(Model.status == status)

    query = query.order_by(Model.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    models = result.scalars().unique().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    return {
        "items": [m.to_dict() for m in models],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/names")
async def get_model_names(db: AsyncSession = Depends(get_db)):
    """Quick endpoint to get all active model names for dropdowns."""
    result = await db.execute(
        select(Model).where(Model.status == "active")
    )
    models = result.scalars().unique().all()
    return [{"id": m.id, "model_name": m.model_name, "parts_count": len(m.parts)} for m in models]


@router.get("/{model_id}")
async def get_model(model_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single model with its parts."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model.to_dict()


@router.post("", status_code=201)
async def create_model(body: ModelCreate, db: AsyncSession = Depends(get_db)):
    """Create a new model and assign parts."""
    existing = await db.execute(select(Model).where(Model.model_name == body.model_name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Model name already exists")

    clean_path = (body.model_path or "").strip().strip('"').strip("'")
    model = Model(model_name=body.model_name, model_path=clean_path)
    db.add(model)
    await db.flush()  # get model.id

    # Assign parts
    if body.part_ids:
        for pid in body.part_ids:
            db.add(ModelPart(model_id=model.id, part_id=pid))

    await db.commit()
    await db.refresh(model)
    return model.to_dict()


@router.put("/{model_id}")
async def update_model(model_id: int, body: ModelUpdate, db: AsyncSession = Depends(get_db)):
    """Update model details and optionally reassign parts."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if body.model_name is not None:
        dup = await db.execute(
            select(Model).where(Model.model_name == body.model_name, Model.id != model_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Model name already exists")
        model.model_name = body.model_name
    if body.model_path is not None:
        model.model_path = body.model_path.strip().strip('"').strip("'")

    # Reassign parts if provided
    if body.part_ids is not None:
        await db.execute(delete(ModelPart).where(ModelPart.model_id == model_id))
        for pid in body.part_ids:
            db.add(ModelPart(model_id=model.id, part_id=pid))

    await db.commit()
    await db.refresh(model)
    return model.to_dict()


@router.delete("/{model_id}")
async def delete_model(model_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a model and its part associations."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    await db.execute(delete(ModelPart).where(ModelPart.model_id == model_id))
    await db.delete(model)
    await db.commit()
    return {"detail": "Model deleted"}


@router.patch("/{model_id}/status")
async def toggle_model_status(model_id: int, body: StatusUpdate, db: AsyncSession = Depends(get_db)):
    """Enable/disable a model."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    model.status = body.status
    await db.commit()
    await db.refresh(model)
    return model.to_dict()


@router.put("/{model_id}/parts")
async def assign_parts(model_id: int, body: PartAssignment, db: AsyncSession = Depends(get_db)):
    """Replace all part assignments for a model."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    await db.execute(delete(ModelPart).where(ModelPart.model_id == model_id))
    for pid in body.part_ids:
        db.add(ModelPart(model_id=model.id, part_id=pid))

    await db.commit()
    await db.refresh(model)
    return model.to_dict()


@router.get("/{model_id}/parts")
async def get_model_parts(model_id: int, db: AsyncSession = Depends(get_db)):
    """Get all parts assigned to a model."""
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    return {"parts": [p.to_dict() for p in model.parts]}
