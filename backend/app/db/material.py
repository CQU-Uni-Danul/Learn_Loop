from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.base import Base

class Material(Base):
    __tablename__ = "materials"

    material_id   = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id    = Column(Integer, ForeignKey("teachers.teacher_id", ondelete="CASCADE"), nullable=False)
    title         = Column(String(200), nullable=False)
    description   = Column(Text)
    subject       = Column(String(100))
    file_path     = Column(String(500), nullable=False)
    target_grade  = Column(String(20), nullable=False)
    target_section= Column(String(20))
    created_at    = Column(DateTime, server_default=func.now(), nullable=False)

    teacher = relationship("Teacher")
