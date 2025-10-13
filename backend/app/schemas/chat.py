from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatReply(BaseModel):
    reply: str
