from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...db.models.student import Student
from ...db.models.user import User
from ...schemas.student import StudentCreate, StudentUpdate, StudentOut
from ...core.security import hash_password
from ..deps import require_roles

router = APIRouter()

def _to_out(s: Student) -> StudentOut:
    return StudentOut(
        id=s.student_id,
        full_name=s.full_name,
        email=s.email,
        role=s.role,
        grade=str(s.grade) if s.grade is not None else None,
        class_=s._class,  # map DB -> schema alias
    )

# ---------- Create (users + students) ----------
@router.post("/", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    # unique email across users
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")

    try:
        # validate required "class"
        cls = (payload.class_ or "").strip()
        if not cls:
            raise HTTPException(status_code=422, detail="Class is required")

        # 1) create users row (login)
        u = User(
            email=payload.email,
            full_name=payload.full_name,
            role="student",
            password_hash=hash_password(payload.password),
        )
        db.add(u)
        db.flush()

        # 2) create students row (business fields)
        s = Student(
            full_name=payload.full_name,
            email=payload.email,
            role="student",
            grade=payload.grade,
            _class=cls,
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        return _to_out(s)

    except Exception:
        db.rollback()
        raise

# ---------- List ----------
@router.get("/", response_model=List[StudentOut])
def list_students(
    q: Optional[str] = Query(default=None, description="Search by name or email"),
    grade: Optional[str] = None,
    class_: Optional[str] = Query(default=None, alias="class"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    qry = db.query(Student)
    if q:
        like = f"%{q}%"
        qry = qry.filter((Student.full_name.ilike(like)) | (Student.email.ilike(like)))
    if grade:
        qry = qry.filter(Student.grade == grade)
    if class_:
        qry = qry.filter(Student._class == class_)

    rows = qry.order_by(Student.student_id.asc()).offset(skip).limit(limit).all()
    return [_to_out(s) for s in rows]

# ---------- Get ----------
@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    s = db.query(Student).filter(Student.student_id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return _to_out(s)

# ---------- Update (sync users + students) ----------
@router.patch("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    s = db.query(Student).filter(Student.student_id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    u = db.query(User).filter(User.email == s.email).first()
    if not u:
        raise HTTPException(status_code=409, detail="Linked user not found for this student")

    # email change -> ensure unique
    if payload.email and payload.email != s.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="Email already in use")

    try:
        if payload.full_name is not None:
            s.full_name = payload.full_name
            u.full_name = payload.full_name

        if payload.email is not None:
            s.email = payload.email
            u.email = payload.email

        if payload.grade is not None:
            s.grade = payload.grade

        if payload.class_ is not None:
            cls = payload.class_.strip()
            if not cls:
                raise HTTPException(status_code=422, detail="Class cannot be empty")
            s._class = cls

        if payload.password:
            u.password_hash = hash_password(payload.password)

        db.commit()
        db.refresh(s)
        return _to_out(s)

    except Exception:
        db.rollback()
        raise

# ---------- Delete (both tables) ----------
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    s = db.query(Student).filter(Student.student_id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        db.delete(s)
        u = db.query(User).filter(User.email == s.email).first()
        if u:
            db.delete(u)
        db.commit()
        return
    except Exception:
        db.rollback()
        raise
