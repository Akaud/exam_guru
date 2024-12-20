from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: str
    surname: str
    role: str

class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: str
    surname: str
    role: str

    class Config:
        from_attributes = True

class ExamCreate(BaseModel):
    title: str
    description: str

class Exam(BaseModel):
    id: int
    title: str
    description: str
    owner_id: int

    class Config:
        from_attributes = True

class ChoiceCreate(BaseModel):
    choice_text: str
    is_correct: bool

class Choice(BaseModel):
    id: int
    choice_text: str
    is_correct: bool
    question_id: int

    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    question_text: str
    is_multiple_choice: bool
    choices: List[ChoiceCreate]
    image_path: Optional[str] = None

class Question(BaseModel):
    id: int
    question_text: str
    exam_id: int
    is_multiple_choice: bool
    choices: List[Choice]
    image_path: Optional[str] = None

    class Config:
        from_attributes = True
