from pydantic import BaseModel, EmailStr
from .user import UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"
