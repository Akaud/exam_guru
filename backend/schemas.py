from pydantic import BaseModel, EmailStr
from typing import List


# User creation model (used for creating a user, includes password)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    name: str
    surname: str
    role: str


# User response model (used for reading user data, excludes password)
class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    name: str
    surname: str
    role: str

    class Config:
        from_attributes = True  # This is the correct option to use for ORM integration


# Exam creation model
class ExamCreate(BaseModel):
    title: str
    description: str


# Exam response model
class Exam(BaseModel):
    id: int
    title: str
    description: str
    owner_id: int

    class Config:
        from_attributes = True


# Choice creation model (used when creating choices)
class ChoiceCreate(BaseModel):
    choice_text: str
    is_correct: bool


# Choice response model (used when reading choices)
class Choice(BaseModel):
    id: int
    choice_text: str
    is_correct: bool
    question_id: int

    class Config:
        from_attributes = True


# Question creation model (used when creating questions)
class QuestionCreate(BaseModel):
    question_text: str
    choices: List[ChoiceCreate]


# Question response model (used when reading questions)
class Question(BaseModel):
    id: int
    question_text: str
    exam_id: int
    choices: List[Choice]  # Should return a list of Choice, not ChoiceCreate

    class Config:
        from_attributes = True
