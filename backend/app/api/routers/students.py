from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text

from ...db.session import get_db
from ...db.models.student import Student
from ...db.models.user import User
from ...schemas.student import StudentCreate, StudentUpdate, StudentOut
from ...core.security import hash_password
from ..deps import get_current_user, require_roles

router = APIRouter(tags=["students"])

def _to_out(s: Student) -> StudentOut:
    return StudentOut(
        id=s.student_id,
        full_name=s.full_name,
        email=s.email,
        role=s.role,
        grade=str(s.grade) if s.grade is not None else None,
        class_=s._class,
    )

# ---------- Create (users + students) ----------
@router.post("/", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))  # admin registers students
):
    # unique email across ALL users
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")

    try:
        # 1) users (login)
        u = User(
            full_name=payload.full_name,
            email=payload.email,
            role="student",
            password_hash=hash_password(payload.password),
        )
        db.add(u)
        db.flush()  # get u.user_id

        # 2) students (profile) — keep mirrored columns for friend’s flows
        s = Student(
            user_id=u.user_id,
            full_name=payload.full_name,
            email=payload.email,
            role="student",
            grade=payload.grade,
            _class=payload.class_,
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        return _to_out(s)
    except Exception:
        db.rollback()
        raise

# ---------- Read list ----------
@router.get("/", response_model=List[StudentOut])
def list_students(
    q: Optional[str] = Query(default=None, description="Search by name/email"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    qry = db.query(Student)
    if q:
        like = f"%{q}%"
        qry = qry.filter((Student.full_name.ilike(like)) | (Student.email.ilike(like)))
    rows = qry.order_by(Student.student_id.asc()).offset(skip).limit(limit).all()
    return [_to_out(s) for s in rows]

# ---------- Update (both tables) ----------
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

    # linked user via user_id (preferred); fallback via email if needed
    u = db.query(User).filter(User.user_id == s.user_id).first()
    if not u:
        u = db.query(User).filter(User.email == s.email).first()
        if not u:
            raise HTTPException(status_code=409, detail="Linked user not found for this student")

    # if changing email, keep system-wide uniqueness
    if payload.email and payload.email != s.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="Email already in use")

    try:
        # user updates
        if payload.full_name is not None:
            u.full_name = payload.full_name
        if payload.email is not None:
            u.email = payload.email
        if payload.password:
            u.password_hash = hash_password(payload.password)

        # student updates (mirror)
        if payload.full_name is not None:
            s.full_name = payload.full_name
        if payload.email is not None:
            s.email = payload.email
        if payload.grade is not None:
            s.grade = payload.grade
        if payload.class_ is not None:
            cls = payload.class_.strip()
            if not cls:
                raise HTTPException(status_code=422, detail="Class cannot be empty")
            s._class = cls

        db.commit()
        db.refresh(s)
        return _to_out(s)
    except Exception:
        db.rollback()
        raise

# ---------- Delete (both tables) ----------
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    s = db.query(Student).filter(Student.student_id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        # remove student + linked user (via user_id preferred; fallback by email)
        u = db.query(User).filter(User.user_id == s.user_id).first()
        if not u:
            u = db.query(User).filter(User.email == s.email).first()
        db.delete(s)
        if u:
            db.delete(u)
        db.commit()
        return
    except Exception:
        db.rollback()
        raise

# ---------- Student schedule (stub used by friend) ----------
@router.get("/schedule/me")
def my_schedule(current: User = Depends(require_roles(["student", "admin"]))):
    return {
        "student_id": current.user_id,
        "today": [
            {"subject": "Mathematics", "teacher": "Tom Teacher", "time": "09:00 – 10:00"},
            {"subject": "Physics",    "teacher": "Tom Teacher", "time": "11:00 – 12:30"},
        ],
    }

# ---------- Timetable (friend’s SQL) ----------
@router.get("/timetable/{student_id}")
def get_timetable(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(["student", "admin"]))
):
    # student can only read their own
    if current.role == "student" and student_id != current.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    sql = text("""
        SELECT DISTINCT
            tt.day_of_week AS day,
            tt.start_time  AS start,
            tt.end_time    AS end,
            c.class_name   AS subject,
            u.full_name    AS teacher
        FROM timetables tt
        JOIN class_students cs ON cs.student_id = tt.student_id
        JOIN classes c ON tt.class_id = c.class_id
        LEFT JOIN users u ON tt.teacher_id = u.user_id
        WHERE cs.student_id = :student_id
        ORDER BY FIELD(tt.day_of_week,
            'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
            tt.start_time;
    """)
    result = db.execute(sql, {"student_id": student_id}).mappings().all()
    rows = [dict(r) for r in result]
    if not rows:
        raise HTTPException(status_code=404, detail="No timetable found")
    return {"week": group_by_day(rows)}

def group_by_day(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        grouped.setdefault(r["day"], {"day": r["day"], "items": []})["items"].append(
            {"subject": r["subject"], "teacher": r["teacher"], "start": str(r["start"]), "end": str(r["end"])}
        )
    return list(grouped.values())

# ---------- Notifications (friend’s endpoints) ----------

@router.get("/notifications")
def get_student_notifications(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(status_code=403, detail="Forbidden")

    rows = db.execute(
        text("""
            SELECT n.notification_id, n.message, n.date_sent, n.is_read,
                   u.full_name AS teacher_name
            FROM notifications n
            JOIN users u ON u.user_id = n.sent_by
            WHERE n.sent_to = :sid
            ORDER BY n.date_sent DESC
        """),
        {"sid": current.user_id}
    ).mappings().all()

    return {"notifications": list(rows)}

@router.get("/notifications/unread")
def get_unread_count(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(status_code=403, detail="Forbidden")

    cnt = db.execute(
        text("SELECT COUNT(*) FROM notifications WHERE sent_to = :sid AND is_read = 0"),
        {"sid": current.user_id},
    ).scalar_one()
    return {"unread": int(cnt or 0)}

@router.post("/notifications/mark-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(status_code=403, detail="Forbidden")

    db.execute(text("UPDATE notifications SET is_read = 1 WHERE sent_to = :sid"), {"sid": current.user_id})
    db.commit()
    return {"success": True}
