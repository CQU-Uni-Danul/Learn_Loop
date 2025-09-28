from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime 
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy import text
from fastapi import File, UploadFile
import shutil

from ...db.session import get_db
from ...db.models.teacher import Teacher
from ...db.models.user import User
from ...schemas.teacher import TeacherCreate, TeacherOut, TeacherUpdate
from ...core.security import hash_password
from ..deps import require_roles

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer


# backend/app/api/routers/teacher.py
router = APIRouter(tags=["teacher"])



def _to_out(t: Teacher) -> TeacherOut:
    return TeacherOut(
        id=t.teacher_id,
        full_name=t.full_name,
        email=t.email,
        role=t.role,
        subject=t.subject,
        department=t.department,
        employee_code=t.employee_code,
        phone=t.phone,
    )




@router.post("/", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(["admin"])),
):
    """Create a new teacher and linked user account."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")

    try:
        # Create user for login
        u = User(
            email=payload.email,
            full_name=payload.full_name,
            role="teacher",
            password_hash=hash_password(payload.password),
        )
        db.add(u)
        db.flush()  # ensures user_id is generated

        # Create teacher profile
        t = Teacher(
            teacher_id=u.user_id,  # link teacher_id with user_id for consistency
            full_name=payload.full_name,
            email=payload.email,
            role="teacher",
            subject=payload.subject,
            department=payload.department,
            employee_code=payload.employee_code,
            phone=payload.phone,
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return _to_out(t)

    except Exception as e:
        db.rollback()
        print("Error creating teacher:", e)
        raise HTTPException(status_code=500, detail="Failed to create teacher")


@router.get("/", response_model=List[TeacherOut])
def list_teachers(
    q: Optional[str] = Query(default=None, description="Search by name/email"),
    subject: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(["admin"])),
):
    """List teachers with optional search and pagination."""
    qry = db.query(Teacher)
    if q:
        like = f"%{q}%"
        qry = qry.filter(or_(Teacher.full_name.ilike(like), Teacher.email.ilike(like)))
    if subject:
        qry = qry.filter(Teacher.subject.ilike(f"%{subject}%"))
    rows = qry.order_by(Teacher.teacher_id.asc()).offset(skip).limit(limit).all()
    return [_to_out(t) for t in rows]


@router.get("/{teacher_id}", response_model=TeacherOut)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(["admin"])),
):
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return _to_out(t)


@router.patch("/{teacher_id}", response_model=TeacherOut)
def update_teacher(
    teacher_id: int,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(["admin"])),
):
    """Update teacher profile and linked user account."""
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    u = db.query(User).filter(User.user_id == t.teacher_id).first()
    if not u:
        raise HTTPException(
            status_code=409, detail="Linked user not found for this teacher"
        )

    if payload.email and payload.email != t.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="Email already in use")

    try:
        if payload.full_name is not None:
            t.full_name = payload.full_name
            u.full_name = payload.full_name
        if payload.email is not None:
            t.email = payload.email
            u.email = payload.email
        if payload.subject is not None:
            t.subject = payload.subject
        if payload.department is not None:
            t.department = payload.department
        if payload.employee_code is not None:
            t.employee_code = payload.employee_code
        if payload.phone is not None:
            t.phone = payload.phone
        if payload.password:
            u.password_hash = hash_password(payload.password)

        db.commit()
        db.refresh(t)
        return _to_out(t)

    except Exception as e:
        db.rollback()
        print("Error updating teacher:", e)
        raise HTTPException(status_code=500, detail="Failed to update teacher")


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(["admin"])),
):
    """Delete a teacher and linked user account."""
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    try:
        # Delete linked user first
        u = db.query(User).filter(User.user_id == t.teacher_id).first()
        if u:
            db.delete(u)

        db.delete(t)
        db.commit()
        return

    except Exception as e:
        db.rollback()
        print("Error deleting teacher:", e)
        raise HTTPException(status_code=500, detail="Failed to delete teacher")

# =====================
# Teacher Schedule
# =====================
@router.get("/schedule/me")
def my_schedule(
    current: User = Depends(require_roles(["teacher", "admin"])),
    db: Session = Depends(get_db),
):
    """Get today's schedule for the logged-in teacher."""
    # Use current weekday (e.g., Monday, Tuesday...)
    # today_name = datetime.now().strftime("%A")
    # For testing, you can hardcode:
    today_name = 'Monday'

    rows = db.execute(
        text("""
            SELECT 
                c.class_name AS subject,
                CONCAT('Grade ', s.grade, ' • ', c.class_name) AS section,
                CONCAT(
                    DATE_FORMAT(t.start_time, '%H:%i'), 
                    ' – ', 
                    DATE_FORMAT(t.end_time, '%H:%i')
                ) AS time
            FROM timetables t
            JOIN students s ON t.student_id = s.student_id
            JOIN classes c ON t.class_id = c.class_id
            WHERE t.teacher_id = :tid AND t.day_of_week = :day
        """),
        {"tid": current.user_id, "day": today_name}
    ).mappings().all()

    return {
        "teacher_id": current.user_id,
        "day": today_name,
        "schedule": list(rows),
    }


# # Materials storage folder
# MATERIALS_DIR = "teacher_materials"

# @router.get("/materials")
# def list_materials(current: User = Depends(require_roles(["teacher"]))):
#     """List uploaded materials for the current teacher."""
#     import os
#     os.makedirs(MATERIALS_DIR, exist_ok=True)
#     # Filter files by teacher ID
#     teacher_files = [
#         f for f in os.listdir(MATERIALS_DIR) if f.startswith(f"{current.user_id}_")
#     ]
#     return teacher_files


# @router.post("/materials/upload")
# def upload_material(
#     file: UploadFile = File(...),
#     current: User = Depends(require_roles(["teacher"]))
# ):
#     """Upload a file for the current teacher."""
#     import os
#     os.makedirs(MATERIALS_DIR, exist_ok=True)
#     file_path = os.path.join(MATERIALS_DIR, f"{current.user_id}_{file.filename}")
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#     return {"ok": True, "filename": file.filename}