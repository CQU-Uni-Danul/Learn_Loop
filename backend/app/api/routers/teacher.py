from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...db.session import get_dbfrom datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text


from ...db.models.teacher import Teacher, get_db
from ...db.models.user import User
from ...schemas.teacher import TeacherCreate, TeacherOut, TeacherUpdate
from ...core.security import hash_password
from ..deps import require_roles

router = APIRouter()

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
    _admin = Depends(require_roles(["admin"]))
):
    # Ensure unique email across users (login table)
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")

    try:
        # 1) users (for login)
        u = User(
            email=payload.email,
            full_name=payload.full_name,
            role="teacher",
            password_hash=hash_password(payload.password),
        )
        db.add(u)
        db.flush()

        # 2) teachers (business/profile)
        t = Teacher(
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
    except Exception:
        db.rollback()
        raise

@router.get("/", response_model=List[TeacherOut])
def list_teachers(
    q: Optional[str] = Query(default=None, description="Search by name/email"),
    subject: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    qry = db.query(Teacher)
    if q:
        like = f"%{q}%"
        qry = qry.filter((Teacher.full_name.ilike(like)) | (Teacher.email.ilike(like)))
    if subject:
        qry = qry.filter(Teacher.subject == subject)
    rows = qry.order_by(Teacher.teacher_id.asc()).offset(skip).limit(limit).all()
    return [_to_out(t) for t in rows]

@router.get("/{teacher_id}", response_model=TeacherOut)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return _to_out(t)

@router.patch("/{teacher_id}", response_model=TeacherOut)
def update_teacher(
    teacher_id: int,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # find linked user by current email
    u = db.query(User).filter(User.email == t.email).first()
    if not u:
        raise HTTPException(status_code=409, detail="Linked user not found for this teacher")

    # email change -> ensure unique
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
    except Exception:
        db.rollback()
        raise

@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    t = db.query(Teacher).filter(Teacher.teacher_id == teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    try:
        # delete teacher + linked user
        db.delete(t)
        u = db.query(User).filter(User.email == t.email).first()
        if u:
            db.delete(u)
        db.commit()
        return
    except Exception:
        db.rollback()
        raise
