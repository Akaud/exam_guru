import os

from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated, List

import crud
import models
import schemas

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

origins = [
    "http://localhost:3000",
    "https://yourfrontenddomain.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

db_dependency = Annotated[Session, Depends(get_db)]


@app.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, db: db_dependency) -> schemas.User:
    db_user = crud.get_user(db=db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return crud.create_user(db=db, user=user)


def authenticate_user(username: str, password: str, db: db_dependency):
    user = crud.get_user(db=db, username=username)
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid")


@app.get("/verify-token/{token}")
async def verify_user_token(token: str):
    verify_token(token=token)
    return {"message": "Token is valid"}


@app.get("/users", response_model=List[schemas.User])
async def list_users(db: db_dependency):
    users = crud.get_users(db=db)
    return users


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_username: str = payload.get("sub")
        if user_username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user_id = crud.get_user_id(db, user_username)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


# Update a user
@app.put("/user/{user_id}", response_model=schemas.User)
async def update_user(user_id: int, user: schemas.UserCreate, db: db_dependency):
    db_user = crud.update_user(db, user_id, user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Delete a user
@app.delete("/user/{user_id}", response_model=dict)
async def delete_user(user_id: int, db: db_dependency):
    result = crud.delete_user(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


### Exam Routes ###

# Create an exam
@app.post("/exam/", response_model=schemas.Exam, status_code=status.HTTP_201_CREATED)
def create_exam(exam: schemas.ExamCreate, db: db_dependency, current_user: models.User = Depends(get_current_user)):
    new_exam = models.Exam(
        title=exam.title,
        description=exam.description,
        owner_id=current_user.id
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam


# Read a specific exam
@app.get("/exam/{exam_id}", response_model=schemas.Exam)
async def read_exam(exam_id: int, db: db_dependency):
    db_exam: object = crud.read_exam(db=db, exam_id=exam_id)
    if db_exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return db_exam


# Update an exam
@app.put("/exam/{exam_id}", response_model=schemas.Exam)
async def update_exam(exam_id: int, exam: schemas.ExamCreate, db: db_dependency):
    db_exam = crud.update_exam(db, exam_id, exam)
    if db_exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return db_exam



# Delete an exam
@app.delete("/exam/{exam_id}", response_model=dict)
async def delete_exam(exam_id: int, db: db_dependency):
    result = crud.delete_exam(db, exam_id)
    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted successfully"}


@app.get("/exams/")
async def read_exams(db: db_dependency):
    db_exams = crud.read_exams(db=db)  # Fetch all exams from the database
    return db_exams


### Question Routes ###


# Create a question
@app.post("/exam/{exam_id}/question/", response_model=schemas.Question, status_code=status.HTTP_201_CREATED)
async def create_question(question: schemas.QuestionCreate, exam_id: int, db: db_dependency):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db_question = crud.create_question(db=db, question=question, exam_id=exam_id)
    return db_question


# Get a question
@app.get("/exam/{exam_id}/question/{question_id}")
async def read_question(exam_id: int,question_id: int, db: Session = Depends(get_db)):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    result = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return result


# Update a question
@app.put("/exam/{exam_id}/question/{question_id}", response_model=schemas.Question)
async def update_question(exam_id: int,question_id: int, question: schemas.QuestionCreate, db: db_dependency):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db_question = crud.update_question(db, question_id, question)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question


# Delete a question
@app.delete("/exam/{exam_id}/question/{question_id}", response_model=dict)
async def delete_question(exam_id: int,question_id: int, db: db_dependency):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    result = crud.delete_question(db, question_id)
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}


@app.get("/exams/{exam_id}/questions", response_model=List[schemas.Question])
async def list_questions_by_exam(exam_id: int, db: db_dependency):

    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = crud.get_questions_by_exam(db=db, exam_id=exam_id)

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this exam")

    return questions

### Choice Routes ###


@app.post("/exam/{exam_id}/question/{question_id}/choice/", response_model=schemas.Choice,
          status_code=status.HTTP_201_CREATED)
async def create_choice(choice: schemas.ChoiceCreate,exam_id: int, question_id: int, db: db_dependency):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    question = db.query(models.Exam).filter(models.Exam.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db_choice = crud.create_choice(db=db, choice=choice, question_id=question_id)
    return db_choice


@app.get("/exam/{exam_id}/question/{question_id}/choice/{choice_id}", response_model=schemas.Choice)
async def read_choice(exam_id: int, question_id: int,choice_id: int, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    question = db.query(models.Exam).filter(models.Exam.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    result = db.query(models.Choice).filter(models.Choice.id == choice_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Choice not found")
    return result

@app.put("/exam/{exam_id}/question/{question_id}/choice/{choice_id}", response_model=schemas.Choice)
async def update_choice(exam_id: int, question_id: int, choice_id: int, choice: schemas.ChoiceCreate, db: db_dependency):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    question = db.query(models.Exam).filter(models.Exam.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db_choice = crud.update_choice(db=db, choice_id=choice_id, choice=choice)
    if db_choice is None:
        raise HTTPException(status_code=404, detail="Choice not found")
    return db_choice


@app.delete("/exam/{exam_id}/question/{question_id}/choice/{choice_id}", response_model=dict)
async def delete_choice(exam_id: int, question_id: int,choice_id: int, db: db_dependency):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    question = db.query(models.Exam).filter(models.Exam.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    result = crud.delete_choice(db, choice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Choice not found")
    return {"message": "Choice deleted successfully"}


@app.get("/exam/{exam_id}/question/{question_id}/choices", response_model=List[schemas.Choice])
async def list_choices_by_question(exam_id: int, question_id: int, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    question = db.query(models.Question).filter(
        models.Question.id == question_id,
        models.Question.exam_id == exam_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found or does not belong to the specified exam")

    choices = db.query(models.Choice).filter(models.Choice.question_id == question_id).all()

    if not choices:
        raise HTTPException(status_code=404, detail="Choices not found for the specified question")

    return choices







