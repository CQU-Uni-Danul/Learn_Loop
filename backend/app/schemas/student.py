from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

def _to_str(v):
    if v is None:
        return None
    # Accept ints/floats and convert to trimmed strings
    return str(v).strip()

class StudentBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    grade: Optional[str] = None
    # Python name class_, JSON key "class"
    class_: str = Field(alias="class", min_length=1, max_length=20)

    # Coerce incoming numbers (e.g., 8) to "8"
    @field_validator("grade", mode="before")
    @classmethod
    def grade_to_str(cls, v):
        return _to_str(v)

    @field_validator("class_", mode="before")
    @classmethod
    def class_to_str(cls, v):
        v = _to_str(v)
        if not v:
            # keep required-ness: non-empty string required
            raise ValueError("class must be a non-empty string")
        return v

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class StudentCreate(StudentBase):
    password: str = Field(min_length=6, max_length=128)

class StudentUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    grade: Optional[str] = None
    class_: Optional[str] = Field(default=None, alias="class", min_length=1, max_length=20)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

    @field_validator("grade", mode="before")
    @classmethod
    def grade_to_str_update(cls, v):
        return _to_str(v)

    @field_validator("class_", mode="before")
    @classmethod
    def class_to_str_update(cls, v):
        return _to_str(v)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class StudentOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    grade: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
