from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...db.session import get_db
from ...api.deps import get_current_user
from ...db.models.user import User

from ...schemas.chat import ChatRequest, ChatReply

router = APIRouter()

def _norm(s: str) -> str:
    return (s or "").strip().lower()

def _student_answer(db: Session, user: User, msg: str) -> str:
    m = _norm(msg)

    # next class
    if any(k in m for k in ["next class", "what is next", "upcoming class"]):
        q = text("""
           SELECT tt.day_of_week AS day,
                  tt.start_time  AS start,
                  tt.end_time    AS end,
                  c.class_name   AS subject,
                  u.full_name    AS teacher
           FROM timetables tt
           JOIN class_students cs ON cs.student_id = tt.student_id
           JOIN classes c ON tt.class_id = c.class_id
           LEFT JOIN users u ON tt.teacher_id = u.user_id
           WHERE cs.student_id = :sid
           ORDER BY FIELD(tt.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                    tt.start_time
           LIMIT 1;
        """)
        row = db.execute(q, {"sid": user.user_id}).mappings().first()
        if row:
            return f"Your next class is **{row['subject']}** with **{row['teacher']}**, {row['day']} {row['start']}–{row['end']}."
        return "I couldn’t find a next class on your timetable."

    # unread notifications
    if "unread" in m or "notification" in m:
        cnt = db.execute(
            text("SELECT COUNT(*) AS c FROM notifications WHERE sent_to = :sid AND is_read = 0"),
            {"sid": user.user_id},
        ).scalar_one()
        return f"You have **{int(cnt)}** unread notification(s)."

    # today schedule
    if any(k in m for k in ["today", "today's schedule", "today timetable", "classes today"]):
        q = text("""
           SELECT tt.day_of_week AS day, tt.start_time AS start, tt.end_time AS end,
                  c.class_name AS subject, u.full_name AS teacher
           FROM timetables tt
           JOIN class_students cs ON cs.student_id = tt.student_id
           JOIN classes c ON tt.class_id = c.class_id
           LEFT JOIN users u ON tt.teacher_id = u.user_id
           WHERE cs.student_id = :sid
           ORDER BY tt.start_time;
        """)
        rows = db.execute(q, {"sid": user.user_id}).mappings().all()
        if not rows:
            return "You have no classes listed today."
        lines = [f"- {r['subject']} with {r['teacher']} • {r['start']}–{r['end']} ({r['day']})" for r in rows]
        return "Here’s your schedule:\n" + "\n".join(lines)

    return "I can help with your **timetable** and **notifications**. Try: “What is my next class?”, “Show unread notifications”, or “Today’s schedule”."

def _teacher_answer(db: Session, user: User, msg: str) -> str:
    m = _norm(msg)

    # my schedule (simple: classes I teach today)
    if any(k in m for k in ["today", "today's schedule", "classes today", "my schedule"]):
        q = text("""
           SELECT tt.day_of_week AS day, tt.start_time AS start, tt.end_time AS end,
                  c.class_name AS subject
           FROM timetables tt
           JOIN classes c ON tt.class_id = c.class_id
           WHERE tt.teacher_id = :tid
           ORDER BY tt.start_time;
        """)
        rows = db.execute(q, {"tid": user.user_id}).mappings().all()
        if not rows:
            return "You have no classes listed today."
        lines = [f"- {r['subject']} • {r['start']}–{r['end']} ({r['day']})" for r in rows]
        return "Your schedule:\n" + "\n".join(lines)

    # how many unread messages from students (notifications table addressed to teacher)
    if "unread" in m or "notification" in m:
        cnt = db.execute(
            text("SELECT COUNT(*) FROM notifications WHERE sent_to = :tid AND is_read = 0"),
            {"tid": user.user_id},
        ).scalar_one()
        return f"You have **{int(cnt)}** unread notification(s)."

    # how many students in my classes
    if any(k in m for k in ["how many students", "students count", "student count"]):
        q = text("""
           SELECT COUNT(DISTINCT cs.student_id) AS cnt
           FROM timetables tt
           JOIN class_students cs ON cs.class_id = tt.class_id
           WHERE tt.teacher_id = :tid;
        """)
        cnt = db.execute(q, {"tid": user.user_id}).scalar_one() or 0
        return f"You have **{int(cnt)}** unique student(s) across your classes."

    return "I can help with your **teaching schedule**, **unread notifications**, and **student counts**. Try: “My schedule today”, “Unread notifications”, or “How many students do I have?”"

@router.post("/student", response_model=ChatReply)
def chat_student(req: ChatRequest, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role not in ("student", "admin"):
        raise HTTPException(status_code=403, detail="Only students/admin can use this endpoint")
    return ChatReply(reply=_student_answer(db, current, req.message))

@router.post("/teacher", response_model=ChatReply)
def chat_teacher(req: ChatRequest, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers/admin can use this endpoint")
    return ChatReply(reply=_teacher_answer(db, current, req.message))
