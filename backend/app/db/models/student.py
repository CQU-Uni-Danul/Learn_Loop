from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref
from ...db.base import Base

class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)

    # NEW: canonical link to users table
    user_id    = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Keep your friend's columns so existing queries continue to work
    full_name  = Column(String(100), nullable=False)
    email      = Column(String(120), unique=True, index=True, nullable=False)
    role       = Column(String(20), nullable=False, default="student")

    grade      = Column(String(20), nullable=True)
    _class     = Column("class", String(20), nullable=False)

    # Handy relationship if you need it later
    user = relationship("User", backref=backref("student", uselist=False, cascade="all,delete"))
