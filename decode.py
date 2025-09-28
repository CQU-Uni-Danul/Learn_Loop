import jwt

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzU5MDcyNDE3LCJleHAiOjE3NTkwNzk2MTd9.cipROgUacZRKmgbvOB2xyizlDw4DpCqXGZD57cxhsv8"
payload = jwt.decode(token, options={"verify_signature": False})
print(payload)
