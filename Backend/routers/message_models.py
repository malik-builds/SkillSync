from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class Message(BaseModel):
    id: str
    senderId: str       # email of sender
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class Conversation(Document):
    participants: List[str]     # [recruiter_email, student_email]
    job_title: str = ""         # context: what role they talked about
    messages: List[Message] = []
    last_message: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_archived: bool = False

    class Settings:
        name = "conversations"
