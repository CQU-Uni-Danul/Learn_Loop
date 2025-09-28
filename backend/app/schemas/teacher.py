from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

def _norm_phone(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    # Remove spaces, hyphens, parentheses
    s = "".join(ch for ch in str(v).strip() if ch.isdigit() or ch == "+")
    return s

class TeacherBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: Optional[str] = None
    department: Optional[str] = None
    employee_code: Optional[str] = None
    phone: Optional[str] = None  # normalized to +61#########

    # Normalize and validate AU format: +61 followed by exactly 9 digits
    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone_au(cls, v):
        if v in (None, "", "null"):
            return None
        s = _norm_phone(v)
        if not s.startswith("+61") or not s[3:].isdigit() or len(s[3:]) != 9:
            raise ValueError("Phone must be Australian format: +61 followed by 9 digits (e.g., +61412345678).")
        return s

    model_config = ConfigDict(from_attributes=True)

class TeacherCreate(TeacherBase):
    password: str = Field(min_length=6, max_length=128)

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    subject: Optional[str] = None
    department: Optional[str] = None
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone_au_update(cls, v):
        if v in (None, "", "null"):
            return None
        s = _norm_phone(v)
        if not s.startswith("+61") or not s[3:].isdigit() or len(s[3:]) != 9:
            raise ValueError("Phone must be Australian format: +61 followed by 9 digits (e.g., +61412345678).")
        return s

    model_config = ConfigDict(from_attributes=True)

class TeacherOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    subject: Optional[str] = None
    department: Optional[str] = None
    employee_code: Optional[str] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
