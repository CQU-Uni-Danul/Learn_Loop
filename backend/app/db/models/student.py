from sqlalchemy import Column, Integer, String
from ...db.base import Base

class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    full_name  = Column(String(100), nullable=False)
    email      = Column(String(120), unique=True, index=True, nullable=False)
    role       = Column(String(20), nullable=False, default="student")
    grade      = Column(String(20), nullable=True)
    # DB column is literally named `class`; keep NOT NULL to match your schema
    _class     = Column("class", String(20), nullable=False)
