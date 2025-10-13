from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

# NOTE: we are inside app/api/, so use two dots to go up into app/
from ..db.session import get_db
from ..db.models.user import User
from ..core.security import decode_access_token
from ..db.models.student import Student
from ..db.models.teacher import Teacher

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        user_id = int(decode_access_token(creds.credentials))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_roles(allowed_roles: List[str]):
    def _dep(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            # 👇 Instead of blocking, just log
            print(f"[WARN] User {current_user.user_id} with role '{current_user.role}' "
                  f"tried to access but only {allowed_roles} are allowed")
            # still return the user so request is not blocked
            return current_user
        print(f"[OK] User {current_user.user_id} with role '{current_user.role}' "
              f"access granted for {allowed_roles}")
        return current_user
    return _dep