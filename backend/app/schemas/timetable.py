
# backend/app/schemas/timetable.py
from pydantic import BaseModel
from datetime import time

class TimetableCreate(BaseModel):
    student_id: int
    teacher_id: int
    class_id: int
    day_of_week: str
    start_time: time
    end_time: time

