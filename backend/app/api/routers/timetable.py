# backend/app/api/routers/timetable.py
from fastapi import APIRouter, Depends, HTTPException

from ...api.deps import get_current_user
from ...db.models.user import User

router = APIRouter(prefix="/timetable", tags=["timetable"])

# Simple in-memory demo data.
# Replace this with DB queries later.
DEMO_WEEKS = {
    # student_id -> week structure
    1: [
        {
            "day": "Monday",
            "items": [
                {"subject": "Mathematics", "teacher": "Mr. Tomson", "start": "08:00", "end": "09:00"},
                {"subject": "English",     "teacher": "Mrs. Sarah", "start": "09:15", "end": "10:00"},
            ],
        },
        {
            "day": "Tuesday",
            "items": [
                {"subject": "Science", "teacher": "Dr. Khan", "start": "08:00", "end": "09:00"},
                {"subject": "History", "teacher": "Ms. Lee",  "start": "09:15", "end": "10:00"},
            ],
        },
    ]
}

@router.get("/{student_id}")
def get_timetable(
    student_id: int,
    current: User = Depends(get_current_user),
):
    """
    Auth rule:
      - Admin can view any student's timetable
      - A student can only view their own timetable
    """
    if current.role != "admin" and not (current.role == "student" and current.user_id == student_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    week = DEMO_WEEKS.get(student_id, [])
    return {"student_id": student_id, "week": week}
