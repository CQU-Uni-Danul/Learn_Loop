from pydantic import BaseModel, EmailStr
from typing import Literal

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: Literal["admin", "teacher", "student"]
