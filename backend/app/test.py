# from passlib.context import CryptContext

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# print("student123 =>", pwd_context.hash("student123"))
# print("teacher123 =>", pwd_context.hash("teacher123"))
# print("admin123   =>", pwd_context.hash("admin123"))
# backend/print_env.py
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)
print("DATABASE_URL:", os.getenv("DATABASE_URL"))
