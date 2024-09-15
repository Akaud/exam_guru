import os

from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from starlette.responses import RedirectResponse
from starlette.staticfiles import StaticFiles

from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated

import crud
import models
import schemas

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

origins = [
    "http://localhost:3001",
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

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return RedirectResponse(url="/static/favicon.ico")


@app.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: db_dependency):
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


# Read a user
@app.get("/users/{username}")
async def read_user(username: str, db: db_dependency):
    db_user = crud.get_user(db=db, username=username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Update a user
@app.put("/users/{user_id}", response_model=schemas.User)
async def update_existing_user(user_id: int, user: schemas.UserCreate, db: db_dependency):
    db_user = crud.update_user(db, user_id, user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Delete a user
@app.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: int, db: db_dependency):
    result = crud.delete_user(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


### Exam Routes ###

# Create an exam
@app.post("/exams/", response_model=schemas.Exam)
async def create_exam(exam: schemas.ExamCreate, db: db_dependency, user_id: int = 1):
    return crud.create_exam(db=db, exam=exam, user_id=user_id)


# Read a specific exam
@app.get("/exams/{exam_id}", response_model=schemas.Exam)
async def read_exam(exam_id: int, db: db_dependency):
    db_exam: object = crud.read_exam(db=db, exam_id=exam_id)
    if db_exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return db_exam


# Update an exam
@app.put("/exams/{exam_id}", response_model=schemas.Exam)
async def update_existing_exam(exam_id: int, exam: schemas.ExamCreate, db: db_dependency):
    db_exam = crud.update_exam(db, exam_id, exam)
    if db_exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return db_exam


# Delete an exam
@app.delete("/exams/{exam_id}", response_model=dict)
async def delete_existing_exam(exam_id: int, db: db_dependency):
    result = crud.delete_exam(db, exam_id)
    if not result:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted successfully"}


### Question Routes ###

# Get a question
@app.get("/questions/{question_id}")
async def read_question(question_id: int, db: Session = Depends(get_db)):
    result = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return result


# Create a question
@app.post("/questions/", response_model=schemas.Question)
async def create_question(question: schemas.QuestionCreate, exam_id: int, db: db_dependency):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db_question = crud.create_question(db=db, question=question, exam_id=exam_id)
    return db_question


# Update a question
@app.put("/questions/{question_id}", response_model=schemas.Question)
async def update_question(question_id: int, question: schemas.QuestionCreate, db: db_dependency):
    db_question = crud.update_question(db, question_id, question)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question


# Delete a question
@app.delete("/questions/{question_id}", response_model=dict)
async def delete_question(question_id: int, db: db_dependency):
    result = crud.delete_question(db, question_id)
    if not result:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}


### Choice Routes ###

# Get choices for a question
@app.get("/choices/{question_id}")
async def read_choices(question_id: int, db: Session = Depends(get_db)):
    result = db.query(models.Choice).filter(models.Choice.question_id == question_id).all()
    if not result:
        raise HTTPException(status_code=404, detail="Choices are not found")
    return result


# Delete a choice
@app.delete("/choices/{choice_id}", response_model=dict)
async def delete_choice(choice_id: int, db: db_dependency):
    result = crud.delete_choice(db, choice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Choice not found")
    return {"message": "Choice deleted successfully"}

@app.get("/api")
async def root():
    return{"message": "Hello World"}