import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db.session import engine, get_db
from .db.base import Base
from .db.models.user import User
# 👇 Ensure Student model is imported before create_all
from .db.models import student as _student_models  # noqa: F401

from .schemas.auth import LoginRequest, LoginResponse
from .schemas.user import UserOut
from .core.security import verify_password, create_access_token
from .api.deps import get_current_user

# Routers
from .api.routers import timetable, students, teacher
from .api.routers import user as users_router 
from .db.models import teacher as _teacher_models


# Create tables (Student included)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LearnLoop API")

origins_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins_env.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/api/auth/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user_row = db.query(User).filter(User.email == data.email).first()
    if not user_row or not verify_password(data.password, user_row.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(sub=str(user_row.user_id))
    return {
        "user": {"id": user_row.user_id, "email": user_row.email, "name": user_row.full_name, "role": user_row.role},
        "access_token": token,
        "token_type": "bearer",
    }

@app.get("/api/auth/me", response_model=UserOut)
def me(current = Depends(get_current_user)):
    return {"id": current.user_id, "email": current.email, "name": current.full_name, "role": current.role}


@app.get("/debug/current_user")
def debug_user(current: User = Depends(get_current_user)):
    return {
        "id": current.user_id,
        "email": current.email,
        "full_name": current.full_name,
        "role": current.role
    }


# Include routers with prefixes
app.include_router(users_router.router, prefix="/api/users", tags=["users"])
app.include_router(students.router,  prefix="/api/student",  tags=["students"])
app.include_router(timetable.router, prefix="/api/timetable", tags=["timetable"])
app.include_router(teacher.router,   prefix="/api/teacher",   tags=["teacher"])

