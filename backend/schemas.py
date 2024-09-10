from pydantic import BaseModel
from typing import List

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: str
    surname: str
    role: str

class User(BaseModel):
    id: int
    username: str
    password: str
    email: str
    name: str
    surname: str
    role: str

    class Config:
        from_attributes = True  # orm_mode is more appropriate than from_attributes

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

class QuestionCreate(BaseModel):
    question_text: str
    choices: List[ChoiceCreate]

class Question(BaseModel):
    id: int
    question_text: str
    exam_id: int
    choices: List[ChoiceCreate]

    class Config:
        from_attributes = True
