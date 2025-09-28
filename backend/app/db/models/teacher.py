from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from ...db.base import Base

class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id   = Column(Integer, primary_key=True, index=True)
    full_name    = Column(String(100), nullable=False)
    email        = Column(String(120), nullable=False, unique=True, index=True)
    role         = Column(String(20),  nullable=False, default="teacher")
    subject      = Column(String(100), nullable=True)
    department   = Column(String(100), nullable=True)
    employee_code= Column(String(20),  nullable=True, unique=True)
    phone        = Column(String(20),  nullable=True)
    date_created = Column(TIMESTAMP,   nullable=False, server_default=text("CURRENT_TIMESTAMP"))
