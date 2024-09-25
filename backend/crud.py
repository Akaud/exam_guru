from typing import Any

from sqlalchemy.orm import Session
import models
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(username=user.username,
                          email=user.email,
                          hashed_password=hashed_password,
                          name=user.name,
                          surname=user.surname,
                          role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, username: str):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    return db_user


def get_user_id(db: Session, username: str) -> Any | None:
    # Query to find the user by username
    db_user = db.query(models.User).filter(models.User.username == username).first()

    # If user is found, return the user's ID
    if db_user:
        return db_user.id

    # If no user is found, return None or raise an exception
    return None


def update_user(db: Session, user_id: int, user_update: schemas.UserCreate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if not db_user:
        return None

    db_user.username = user_update.username
    db_user.email = user_update.email
    db_user.hashed_password = pwd_context.hash(user_update.password)
    db_user.name = user_update.name
    db_user.surname = user_update.surname
    db_user.role = user_update.role

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if not db_user:
        return None

    db.delete(db_user)
    db.commit()
    return True


def create_exam(db: Session, exam: schemas.ExamCreate, user_id: int):
    db_exam = models.Exam(**exam.model_dump(), owner_id=user_id)
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam


def read_exam(db: Session, exam_id: int):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    return db_exam


def read_exams(db: Session):
    return db.query(models.Exam).all()


def update_exam(db: Session, exam_id: int, exam_update: schemas.ExamCreate):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()

    if not db_exam:
        return None

    db_exam.title = exam_update.title
    db_exam.description = exam_update.description

    db.commit()
    db.refresh(db_exam)
    return db_exam

def delete_exam(db: Session, exam_id: int):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()

    if not db_exam:
        return None

    db.delete(db_exam)
    db.commit()
    return True


def create_question(db: Session, question: schemas.QuestionCreate, exam_id: int):
    db_question = models.Question(question_text=question.question_text, exam_id=exam_id)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    for choice in question.choices:
        db_choice = models.Choice(choice_text=choice.choice_text,
                                  is_correct=choice.is_correct,
                                  question_id=db_question.id)
        db.add(db_choice)

    db.commit()
    return db_question


def update_question(db: Session, question_id: int, question_update: schemas.QuestionCreate):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()

    if not db_question:
        return None  # You may want to raise HTTPException here

    db_question.question_text = question_update.question_text

    # Remove existing choices
    db.query(models.Choice).filter(models.Choice.question_id == question_id).delete()

    # Add updated choices
    for choice in question_update.choices:
        db_choice = models.Choice(choice_text=choice.choice_text,
                                  is_correct=choice.is_correct,
                                  question_id=db_question.id)
        db.add(db_choice)

    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()

    if not db_question:
        return None  # You may want to raise HTTPException here

    db.delete(db_question)
    db.commit()
    return True

def delete_choice(db: Session, choice_id: int):
    db_choice = db.query(models.Choice).filter(models.Choice.id == choice_id).first()

    if not db_choice:
        return None  # You may want to raise HTTPException here

    db.delete(db_choice)
    db.commit()
    return True