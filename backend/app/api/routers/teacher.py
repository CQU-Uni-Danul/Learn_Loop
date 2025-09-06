# backend/app/api/routers/teacher.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pathlib import Path
from typing import List

from ...api.deps import get_current_user, require_roles
from ...db.models.user import User

router = APIRouter(prefix="/teacher", tags=["teacher"])

UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads"  # repo_root/uploads

@router.get("/schedule/me")
def my_schedule(current: User = Depends(require_roles(["teacher", "admin"]))):
    """MVP schedule for the logged-in teacher."""
    # Replace with real DB queries later
    return {
        "teacher_id": current.user_id,
        "today": [
            {"subject": "Mathematics", "section": "Grade 8 • A", "time": "08:00 – 09:00"},
            {"subject": "Science", "section": "Grade 8 • B", "time": "10:15 – 11:00"},
        ],
    }

@router.post("/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    current: User = Depends(require_roles(["teacher", "admin"])),
):
    """Upload a file into uploads/<teacher_id>/"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    teacher_dir = UPLOAD_ROOT / str(current.user_id)
    teacher_dir.mkdir(parents=True, exist_ok=True)
    dest = teacher_dir / file.filename

    # save chunked
    with dest.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    return {"ok": True, "filename": file.filename}

@router.get("/materials", response_model=List[str])
def list_materials(current: User = Depends(require_roles(["teacher", "admin"]))):
    """List uploaded filenames for the current teacher."""
    teacher_dir = UPLOAD_ROOT / str(current.user_id)
    if not teacher_dir.exists():
        return []
    return sorted([p.name for p in teacher_dir.iterdir() if p.is_file()])

# Example timetable update stub (extend later)
@router.put("/timetable")
def update_timetable(payload: dict, current: User = Depends(require_roles(["teacher", "admin"]))):
    """
    Accepts JSON like:
    { "day": "Monday", "items": [ { "subject": "...", "teacher": "...", "start": "08:00", "end": "09:00" } ] }
    Store to DB in a real version.
    """
    # For now: just echo back
    return {"ok": True, "saved": payload}
