# backend/app/api/routers/timetable.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

from ...db.session import get_db
from ...db.models.user import User
from ...api.deps import get_current_user, require_roles
from ...schemas.timetable import TimetableCreate
from ...db.models.student import Student

router = APIRouter( tags=["timetable"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_timetable(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(["teacher", "admin"]))
):
    """
    Create a new timetable entry.
    - Teachers can only create entries for themselves.
    - Validates time order and prevents overlaps.
    """
    if current.role == "teacher" and payload.teacher_id != current.user_id:
        raise HTTPException(
            status_code=403,
            detail="Teachers may only create timetable entries for themselves",
        )

    if payload.start_time >= payload.end_time:
        raise HTTPException(
            status_code=422, detail="start_time must be before end_time"
        )

    # Ensure student exists
    student_exists = db.execute(
        text("SELECT 1 FROM students WHERE student_id = :id"),
        {"id": payload.student_id},
    ).scalar()
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")

    # Ensure teacher exists
    teacher_exists = db.execute(
        text("SELECT 1 FROM users WHERE user_id = :id AND role = 'teacher'"),
        {"id": payload.teacher_id},
    ).scalar()
    if not teacher_exists:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Ensure class exists
    class_exists = db.execute(
        text("SELECT 1 FROM classes WHERE class_id = :id"),
        {"id": payload.class_id},
    ).scalar()
    if not class_exists:
        raise HTTPException(status_code=404, detail="Class not found")

    # Prevent overlap
    overlap_sql = text(
        """
        SELECT COUNT(*) FROM timetables
        WHERE student_id = :student_id
          AND day_of_week = :day
          AND NOT (end_time <= :start_time OR start_time >= :end_time)
        """
    )
    overlap_count = db.execute(
        overlap_sql,
        {
            "student_id": payload.student_id,
            "day": payload.day_of_week,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
        },
    ).scalar_one()

    if int(overlap_count or 0) > 0:
        raise HTTPException(
            status_code=409,
            detail="Time conflict: student already has a class at this time",
        )

    # Insert new timetable row
    insert_sql = text(
        """
        INSERT INTO timetables (student_id, teacher_id, class_id, day_of_week, start_time, end_time)
        VALUES (:student_id, :teacher_id, :class_id, :day, :start_time, :end_time)
        """
    )
    db.execute(
        insert_sql,
        {
            "student_id": payload.student_id,
            "teacher_id": payload.teacher_id,
            "class_id": payload.class_id,
            "day": payload.day_of_week,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
        },
    )
    db.commit()

    # Return inserted row
    new_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()
    row = db.execute(
        text(
            """
            SELECT timetable_id, student_id, teacher_id, class_id, day_of_week, start_time, end_time
            FROM timetables WHERE timetable_id = :id
            """
        ),
        {"id": new_id},
    ).mappings().first()

    return {"timetable": dict(row)} if row else {"success": True}


from ...db.models.student import Student  # make sure this import exists

@router.get("/{student_id}")
def get_timetable(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Map requested student_id -> owner user_id
    owner = db.query(Student.user_id).filter(Student.student_id == student_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Student not found")
    (owner_user_id,) = owner  # unwrap tuple

    # Admin OK; students must own this student_id
    if current.role != "admin":
        if current.role == "student" and current.user_id == owner_user_id:
            pass  # allowed
        else:
            raise HTTPException(status_code=403, detail="Forbidden")

    # ... keep your existing SQL below unchanged ...
    sql = text("""
    SELECT DISTINCT
        tt.day_of_week AS day,
        tt.start_time  AS start,
        tt.end_time    AS end,
        t.subject      AS subject,   -- from teachers table
        t.full_name    AS teacher    -- from teachers table
    FROM timetables tt
    LEFT JOIN teachers t
           ON t.teacher_id = tt.teacher_id
    WHERE tt.student_id = :student_id
    ORDER BY FIELD(tt.day_of_week,
                   'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
             tt.start_time;
""")
    result = db.execute(sql, {"student_id": student_id})
    rows = [dict(r) for r in result.mappings().all()]
    if not rows:
        raise HTTPException(status_code=404, detail="No timetable found")
    return {"student_id": student_id, "week": group_by_day(rows)}


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
