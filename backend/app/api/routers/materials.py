from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
import os, uuid
from ...db.session import get_db
from ...db.models.material import Material
from ...db.models.teacher import Teacher
from ...db.models.student import Student
from ...db.models.user import User
from ..deps import get_current_user, require_roles

router = APIRouter(prefix="/api/materials", tags=["materials"])

# Where to store files locally (ensure this folder exists and is writeable)
UPLOAD_ROOT = "uploads/materials"

def _ensure_dir(path:str):
    os.makedirs(path, exist_ok=True)

@router.post("/", response_model=None, status_code=201)
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
    # roles: teacher or admin
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers or admins can upload materials.")

    # resolve teacher_id (admins may upload on behalf? keep it simple: admin must also be a teacher row if uploading)
    teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
    if not teacher:
        if current.role == "admin":
            raise HTTPException(status_code=400, detail="Admin is not linked to a teacher profile.")
        raise HTTPException(status_code=400, detail="Teacher profile not found.")

    # default subject from teacher profile if not provided
    if subject is None or subject.strip() == "":
        subject = teacher.subject or "General"

    # save file
    _ensure_dir(UPLOAD_ROOT)
    ext = os.path.splitext(file.filename or "")[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(UPLOAD_ROOT, safe_name)

    with open(disk_path, "wb") as out:
        out.write(file.file.read())

    # persist row
    row = Material(
        teacher_id=teacher.teacher_id,
        title=title.strip(),
        description=(description or "").strip() or None,
        subject=subject.strip(),
        file_path=disk_path,              # for S3, save the public URL here instead
        target_grade=target_grade.strip(),
        target_section=(target_section or "").strip() or None,
    )
    db.add(row)
    db.commit()
    return  # 201 Created, no body needed (front-end can re-fetch lists)

@router.get("/mine")
def my_materials(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="Teacher profile not found.")

    q = db.query(Material).filter(Material.teacher_id == teacher.teacher_id).order_by(Material.created_at.desc())
    return [
        {
            "id": m.material_id,
            "title": m.title,
            "description": m.description,
            "subject": m.subject,
            "file_path": m.file_path,
            "target_grade": m.target_grade,
            "target_section": m.target_section,
            "created_at": m.created_at.isoformat(),
        } for m in q.all()
    ]

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

    # If you use a 'class' or 'section' field, fetch it; else ignore section filter
    # Assuming Student has .class_ (or .section) optional field
    section_value = getattr(student, "class_", None) or getattr(student, "section", None)

    q = db.query(Material).filter(Material.target_grade == student.grade)
    if section_value:
        # match exact section OR materials that target entire grade (NULL)
        q = q.filter(
            (Material.target_section == None) | (Material.target_section == str(section_value))
        )
    else:
        q = q.filter(Material.target_section == None)

    q = q.order_by(Material.created_at.desc())

    return [
        {
            "id": m.material_id,
            "title": m.title,
            "description": m.description,
            "subject": m.subject,
            "file_path": m.file_path,
            "target_grade": m.target_grade,
            "target_section": m.target_section,
            "created_at": m.created_at.isoformat(),
            "teacher": m.teacher.full_name if m.teacher else None,
        } for m in q.all()
    ]

@router.delete("/{material_id}", status_code=204)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    m = db.query(Material).filter(Material.material_id == material_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")

    # owner or admin
    if current.role != "admin":
        teacher = db.query(Teacher).filter(Teacher.user_id == current.user_id).first()
        if not teacher or teacher.teacher_id != m.teacher_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    # delete file from disk (best-effort)
    try:
        if m.file_path and os.path.exists(m.file_path):
            os.remove(m.file_path)
    except:
        pass

    db.delete(m)
    db.commit()
    return
