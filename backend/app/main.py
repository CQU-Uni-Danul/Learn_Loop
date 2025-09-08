# backend/app/main.py
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db.session import engine, get_db
from .db.base import Base
from .db.models.user import User
from .schemas.auth import LoginRequest, LoginResponse
from .schemas.user import UserOut
from .core.security import verify_password, create_access_token
from .api.deps import get_current_user

# ⬇️ add this import
from .api.routers import timetable, teacher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LearnLoop API")

origins_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins_env.split(",") if o.strip()] or [
    "http://localhost:5173", "http://127.0.0.1:5173"
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
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(sub=str(user.user_id))
    return {
        "user": {"id": user.user_id, "email": user.email, "name": user.full_name, "role": user.role},
        "access_token": token,
        "token_type": "bearer",
    }

@app.get("/api/auth/me", response_model=UserOut)
def me(current = Depends(get_current_user)):
    return {"id": current.user_id, "email": current.email, "name": current.full_name, "role": current.role}

# ⬇️ include the router
app.include_router(timetable.router)
app.include_router(teacher.router)
