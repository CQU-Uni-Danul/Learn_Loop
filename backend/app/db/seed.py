# backend/app/db/seed.py
from sqlalchemy.orm import Session

from .session import SessionLocal, engine          # db/session.py
from .base import Base                             # db/base.py
from .models.user import User                      # db/models/user.py
from ..core.security import hash_password          # core/security.py


def seed():
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        def upsert(email, full_name, role, plain_password):
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    full_name=full_name,
                    role=role,
                    password_hash=hash_password(plain_password),
                )
                db.add(u)
                print(f"Inserted {role}: {email}")
            else:
                u.full_name = full_name
                u.role = role
                u.password_hash = hash_password(plain_password)
                print(f"Updated {role}: {email}")

        upsert("alice@student.edu", "Alice Student", "student", "student123")
        upsert("tom@school.edu", "Tom Teacher", "teacher", "teacher123")
        upsert("amara@school.edu", "Amara Admin", "admin", "admin123")

        db.commit()
        print("✅ Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
