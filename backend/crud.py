from typing import Any, List
from sqlalchemy.orm import Session
import models
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User Management
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        surname=user.surname,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, username: str):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    return db_user


def get_user_id(db: Session, username: str) -> Any | None:
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if db_user:
        return db_user.id
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


# Exam Management
def create_exam(db: Session, exam: schemas.ExamCreate, user_id: int):
    db_exam = models.Exam(
        title=exam.title,
        description=exam.description,
        owner_id=user_id
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam


def read_exam(db: Session, exam_id: int):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    return db_exam


def read_exams(db: Session) -> List[dict]:
    exams = db.query(models.Exam).all()
    response = []
    for exam in exams:
        response.append({
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "owner_id": exam.owner_id,
            "num_questions": len(exam.questions)
        })
    return response


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


# Question Management
def create_question(db: Session, question: schemas.QuestionCreate, exam_id: int):
    db_question = models.Question(
        question_text=question.question_text,
        exam_id=exam_id,
        is_multiple_choice=question.is_multiple_choice,
        image_path=question.image_path  # Include the image_path
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    for choice in question.choices:
        db_choice = models.Choice(
            choice_text=choice.choice_text,
            is_correct=choice.is_correct,
            question_id=db_question.id
        )
        db.add(db_choice)

    db.commit()
    return db_question


def update_question(db: Session, question_id: int, question_update: schemas.QuestionCreate):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return None

    db_question.question_text = question_update.question_text
    db_question.is_multiple_choice = question_update.is_multiple_choice
    db_question.image_path = question_update.image_path  # Update the image_path

    # Remove existing choices
    db.query(models.Choice).filter(models.Choice.question_id == question_id).delete()

    # Add updated choices
    for choice in question_update.choices:
        db_choice = models.Choice(
            choice_text=choice.choice_text,
            is_correct=choice.is_correct,
            question_id=db_question.id
        )
        db.add(db_choice)

    db.commit()
    db.refresh(db_question)
    return db_question


def delete_question(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return None

    db.delete(db_question)
    db.commit()
    return True


# Choice Management
def delete_choice(db: Session, choice_id: int):
    db_choice = db.query(models.Choice).filter(models.Choice.id == choice_id).first()
    if not db_choice:
        return None
    db.delete(db_choice)
    db.commit()
    return True


def create_choice(db: Session, choice: schemas.ChoiceCreate, question_id: int):
    db_choice = models.Choice(
        choice_text=choice.choice_text,
        is_correct=choice.is_correct,
        question_id=question_id
    )
    db.add(db_choice)
    db.commit()
    db.refresh(db_choice)
    return db_choice


def update_choice(db: Session, choice_id: int, choice: schemas.ChoiceCreate):
    db_choice = db.query(models.Choice).filter(models.Choice.id == choice_id).first()
    if not db_choice:
        return None
    db_choice.choice_text = choice.choice_text
    db_choice.is_correct = choice.is_correct
    db.commit()
    db.refresh(db_choice)
    return db_choice


def get_questions_by_exam(db: Session, exam_id: int):
    questions = db.query(models.Question).filter(models.Question.exam_id == exam_id).all()
    if not questions:
        return []
    return questions


def get_users(db: Session):
    users = db.query(models.User).all()
    if not users:
        return []
    return users
