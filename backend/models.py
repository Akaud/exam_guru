from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    surname = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False)

    exams = relationship("Exam", back_populates="owner", cascade="all, delete-orphan")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="exams")
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("title != ''", name="check_exam_title_not_empty"),
    )

    @property
    def num_questions(self):
        return len(self.questions)

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String(255), nullable=False)
    exam_id = Column(Integer, ForeignKey('exams.id'), nullable=False)
    is_multiple_choice = Column(Boolean, default=True)

    exam = relationship("Exam", back_populates="questions")
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("question_text != ''", name="check_question_text_not_empty"),
    )

class Choice(Base):
    __tablename__ = "choices"

    id = Column(Integer, primary_key=True, index=True)
    choice_text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    question = relationship("Question", back_populates="choices")

    __table_args__ = (
        CheckConstraint("choice_text != ''", name="check_choice_text_not_empty"),
    )
