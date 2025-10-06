from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref
from ...db.base import Base

class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    full_name  = Column(String(100), nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    role       = Column(String(20), nullable=False, default="teacher")  # or Enum('teacher')
    subject    = Column(String(100))
    department = Column(String(100))
    employee_code = Column(String(50))
    phone      = Column(String(20))  # +61#########

    user = relationship("User", backref=backref("teacher", uselist=False, cascade="all,delete"))
