from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models.user import User
from app.core.security import hash_password

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
