# backend/app/api/routers/materials.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
import os, uuid
from sqlalchemy import or_
from sqlalchemy.inspection import inspect
from ...db.session import get_db
from ...db.models.material import Material
from ...db.models.teacher import Teacher
from ...db.models.student import Student
from ...db.models.user import User
from ..deps import get_current_user

router = APIRouter(tags=["materials"])

# Where to store files locally (served via app.mount("/uploads", ...))
UPLOAD_ROOT = os.getenv("MATERIALS_UPLOAD_DIR", "uploads/materials")


def _ensure_upload_dir() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)


def _normalize_str(v) -> str:
    """Return a stripped string ('' if None)."""
    return (str(v).strip() if v is not None else "")


@router.post("/", status_code=status.HTTP_201_CREATED)
def upload_material(
    title: str = Form(...),
    target_grade: str = Form(...),
    description: str = Form(None),
    subject: str = Form(None),
    target_section: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """
    Teachers/Admins upload a file targeted to a grade (and optional section).
    File is saved under UPLOAD_ROOT and file_path is persisted for static serving.
    """
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers or admins can upload materials.")

    # Resolve teacher_id from current user (admin must also have a teacher profile)
    teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
    if not teacher:
        if current.role == "admin":
            raise HTTPException(status_code=400, detail="Admin is not linked to a teacher profile.")
        raise HTTPException(status_code=400, detail="Teacher profile not found.")

    # Defaults / normalization
    title = _normalize_str(title)
    subject = _normalize_str(subject) or (teacher.subject or "General")
    target_grade = _normalize_str(target_grade)            # store as string for consistent matching
    target_section = _normalize_str(target_section) or None
    description = _normalize_str(description) or None

    if not title or not target_grade:
        raise HTTPException(status_code=400, detail="Title and target_grade are required.")

    # Save file
    _ensure_upload_dir()
    original_ext = os.path.splitext(file.filename or "")[1].lower()
    safe_name = f"{uuid.uuid4().hex}{original_ext}"
    disk_path = os.path.join(UPLOAD_ROOT, safe_name)

    try:
        with open(disk_path, "wb") as out:
            out.write(file.file.read())
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    # Persist
    row = Material(
        teacher_id=teacher.teacher_id,
        title=title,
        description=description,
        subject=subject,
        file_path=disk_path,  # served by StaticFiles at /uploads if UPLOAD_ROOT starts with "uploads/"
        target_grade=target_grade,
        target_section=target_section,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    # Return minimal info (frontend doesn't rely on this, but helpful)
    return {
        "id": row.material_id,
        "title": row.title,
        "file_path": row.file_path,
        "target_grade": row.target_grade,
        "target_section": row.target_section,
        "subject": row.subject,
    }


@router.get("/mine")
def my_materials(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """List materials uploaded by the current teacher."""
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")

    teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="Teacher profile not found.")

    q = (
        db.query(Material)
        .filter(Material.teacher_id == teacher.teacher_id)
        .order_by(Material.created_at.desc())
    )
    return [
        {
            "id": m.material_id,
            "title": m.title,
            "description": m.description,
            "subject": m.subject,
            "file_path": m.file_path,
            "target_grade": m.target_grade,
            "target_section": m.target_section,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in q.all()
    ]

def _norm(v):  # keep at module level if you like
    return (str(v).strip() if v is not None else "")

def _get_student_section(student):
    """Return section/class value and the attribute name it came from."""
    # 1) obvious candidates, in order
    for name in ["section", "class_", "class", "section_", "sec", "cls"]:
        if hasattr(student, name):
            val = getattr(student, name)
            if val is not None and _norm(val) != "":
                return _norm(val), name

    # 2) scan all mapped attributes and pick the first that looks like class/section
    try:
        mapper = inspect(student).mapper
        for attr in mapper.attrs:
            key = getattr(attr, "key", "")
            if key and any(tok in key.lower() for tok in ["class", "section"]):
                val = getattr(student, key, None)
                if val is not None and _norm(val) != "":
                    return _norm(val), key
    except Exception:
        pass

    # 3) last resort: scan __dict__
    try:
        for k, v in student.__dict__.items():
            if v is not None and any(tok in k.lower() for tok in ["class", "section"]):
                if _norm(v) != "":
                    return _norm(v), k
    except Exception:
        pass

    return None, None

@router.get("/for-me")
def materials_for_me(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "student":
        raise HTTPException(status_code=403, detail="Students only")

    student = db.query(Student).filter(Student.user_id == current.user_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found.")

    grade_value = _norm(student.grade)
    section_value, section_attr = _get_student_section(student)

    # Base query: grade match
    q = db.query(Material).filter(Material.target_grade == grade_value)

    if section_value:
        q = q.filter(
            or_(
                Material.target_section.is_(None),      # whole grade
                Material.target_section == section_value  # exact section
            )
        )
    else:
        q = q.filter(Material.target_section.is_(None))

    rows = q.order_by(Material.created_at.desc()).all()

    # Debug print so you can see exactly what's happening
    print("[materials_for_me]", {
        "student_user_id": current.user_id,
        "grade_value": grade_value,
        "section_value": section_value,
        "section_attr": section_attr,
        "rows_found": len(rows)
    })

    return [
        {
            "id": m.material_id,
            "title": m.title,
            "description": m.description,
            "subject": m.subject,
            "file_path": m.file_path,
            "target_grade": m.target_grade,
            "target_section": m.target_section,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "teacher": m.teacher.full_name if getattr(m, "teacher", None) else None,
        }
        for m in rows
    ]

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Delete a material (owner teacher or admin). Also removes local file best-effort."""
    m = db.query(Material).filter(Material.material_id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")

    if current.role != "admin":
        teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
        if not teacher or teacher.teacher_id != m.teacher_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    try:
        if m.file_path and os.path.exists(m.file_path):
            os.remove(m.file_path)
    except Exception:
        # don't fail delete if file unlink fails
        pass

    db.delete(m)
    db.commit()
    return