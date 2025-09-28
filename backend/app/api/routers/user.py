# backend/app/api/routers/user.py
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...db.models.user import User
from ...schemas.user import UserOut, UserCreate, UserUpdate
from ...core.security import hash_password
from ..deps import require_roles

router = APIRouter()
Role = Literal["admin", "teacher", "student"]

def _to_out(u: User) -> UserOut:
    return UserOut(id=u.user_id, email=u.email, name=u.full_name, role=u.role)

@router.get("/", response_model=List[UserOut])
def list_users(
    role: Optional[Role] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin = Depends(require_roles(["admin"]))
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    rows = q.order_by(User.user_id.asc()).offset(skip).limit(limit).all()
    return [_to_out(u) for u in rows]

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already in use")
    u = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    db.add(u); db.commit(); db.refresh(u)
    return _to_out(u)

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.email and payload.email != u.email:
        if db.query(User).filter(User.email == payload.email).first():
            raise HTTPException(status_code=409, detail="Email already in use")
        u.email = payload.email
    if payload.full_name is not None: u.full_name = payload.full_name
    if payload.role is not None:      u.role = payload.role
    if payload.password:              u.password_hash = hash_password(payload.password)
    db.commit(); db.refresh(u)
    return _to_out(u)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), _admin = Depends(require_roles(["admin"]))):
    u = db.query(User).filter(User.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u); db.commit()
    return
