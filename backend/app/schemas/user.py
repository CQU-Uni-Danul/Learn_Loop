from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

Role = Literal["admin", "teacher", "student"]

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    role: Role

    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    role: Optional[Role] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: Role

    model_config = ConfigDict(from_attributes=True)
