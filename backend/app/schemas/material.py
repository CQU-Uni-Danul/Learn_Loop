from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MaterialBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    subject: Optional[str] = None
    target_grade: str
    target_section: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass  # file is multipart form field, not in the schema

class MaterialOut(MaterialBase):
    id: int
    file_path: str
    created_at: datetime
    teacher_id: int

    class Config:
        from_attributes = True
