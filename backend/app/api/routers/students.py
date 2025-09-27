# backend/app/api/routers/students.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...api.deps import get_current_user, require_roles, get_db
from ...db.models.user import User

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/schedule/me")
def my_schedule(current: User = Depends(require_roles(["student", "admin"]))):
    """MVP schedule for the logged-in student (stub)."""
    return {
        "student_id": current.user_id,
        "today": [
            {"subject": "Mathematics", "teacher": "Tom Teacher", "time": "09:00 – 10:00"},
            {"subject": "Physics", "teacher": "Tom Teacher", "time": "11:00 – 12:30"},
        ],
    }


@router.get("/timetable/{student_id}")
async def get_timetable(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(["student", "admin"]))
):
    # Security check
    if current.role == "student" and student_id != current.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    sql = text("""
        SELECT DISTINCT
            tt.day_of_week AS day,
            tt.start_time AS start,
            tt.end_time AS end,
            c.class_name AS subject,
            u.full_name AS teacher
        FROM timetables tt
        JOIN class_students cs ON cs.student_id = tt.student_id
        JOIN classes c ON tt.class_id = c.class_id
        LEFT JOIN users u ON tt.teacher_id = u.user_id
        WHERE cs.student_id = :student_id
        ORDER BY FIELD(tt.day_of_week,
                       'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                 tt.start_time;
    """)

    result = db.execute(sql, {"student_id": student_id})
    # ✅ Convert rows to dicts
    rows = [dict(r) for r in result.mappings().all()]

    if not rows:
        raise HTTPException(status_code=404, detail="No timetable found")

    return {"week": group_by_day(rows)}


def group_by_day(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group timetable rows by day of week."""
    grouped = {}
    for r in rows:
        if r["day"] not in grouped:
            grouped[r["day"]] = {"day": r["day"], "items": []}
        grouped[r["day"]]["items"].append(
            {
                "subject": r["subject"],
                "teacher": r["teacher"],
                "start": str(r["start"]),
                "end": str(r["end"]),
            }
        )
    return list(grouped.values())
