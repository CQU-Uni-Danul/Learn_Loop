# backend/app/api/routers/teacher.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pathlib import Path
from typing import List
from datetime import datetime 
from sqlalchemy.orm import Session
from sqlalchemy import text


from ...api.deps import get_current_user, require_roles, get_db
from ...db.models.user import User

router = APIRouter(prefix="/teacher", tags=["teacher"])

# Where uploaded files are stored
UPLOAD_ROOT = Path(__file__).resolve().parents[3] / "uploads"  # repo_root/uploads

# =====================
# Teacher Schedule
# =====================
@router.get("/schedule/me")
def my_schedule(
    current: User = Depends(require_roles(["teacher", "admin"])),
    db: Session = Depends(get_db),
):
    # today_name = datetime.now().strftime("%A")
    today_name = 'Monday'  # For testing, fix to Monday

    rows = db.execute(
        text("""
            SELECT 
            c.class_name AS subject,
            CONCAT('Grade ', s.grade, ' • ', c.class_name) AS section,
            CONCAT(DATE_FORMAT(t.start_time, '%H:%i'), ' – ', DATE_FORMAT(t.end_time, '%H:%i')) AS time
        FROM timetables t
        JOIN students s ON t.student_id = s.student_id
        JOIN classes c ON t.class_id = c.class_id
        WHERE t.teacher_id = :tid AND t.day_of_week = :day
        """),
        {"tid": current.user_id, "day": today_name}
    ).mappings().all()

    return {"teacher_id": current.user_id, "today": list(rows)}

# =====================
# Upload Teaching Material
# =====================
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

    # Save file in chunks
    with dest.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    return {"ok": True, "filename": file.filename}

# =====================
# List Materials
# =====================
@router.get("/materials", response_model=List[str])
def list_materials(current: User = Depends(require_roles(["teacher", "admin"]))):
    """List uploaded filenames for the current teacher."""
    teacher_dir = UPLOAD_ROOT / str(current.user_id)
    if not teacher_dir.exists():
        return []
    return sorted([p.name for p in teacher_dir.iterdir() if p.is_file()])

# =====================
# Update Timetable (stub)
# =====================
@router.put("/timetable")
def update_timetable(payload: dict, current: User = Depends(require_roles(["teacher", "admin"]))):
    """
    Accepts JSON like:
    { "day": "Monday", "items": [ { "subject": "...", "teacher": "...", "start": "08:00", "end": "09:00" } ] }
    Store to DB in a real version.
    """
    # For now: just echo back
    return {"ok": True, "saved": payload}
