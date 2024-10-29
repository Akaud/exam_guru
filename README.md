
# Exam Management System

A full-stack application for managing exams, questions, and choices, built with **FastAPI** for the backend and **React** for the frontend.

## Features

- **User Authentication**: Registration, login, and token-based authentication.
- **CRUD Operations**: Manage users, exams, questions, and choices with standard CRUD functionality.
- **Image Uploads**: Upload images for questions and serve static image files.
- **Role-based Access**: Restrict actions based on user roles.
- **Token Verification**: Validate and verify access tokens for user sessions.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, JWT (JSON Web Tokens)
- **Frontend**: React (setup details are assumed)
- **Database**: SQLite (or another SQL database configured in `database.py`)

## Installation

### Backend

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Backend Dependencies**:
   - Install FastAPI:
     ```bash
     pip install fastapi
     ```
   - Start the FastAPI server using **Uvicorn**:
     ```bash
     uvicorn main:app --reload
     ```

### Frontend

1. **Navigate to Frontend Folder**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm start
   ```
   The server should run on [http://localhost:3000](http://localhost:3000).

### Environment Variables

To set up environment variables, create a `.env` file in the root directory and define the following:

```plaintext
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## API Endpoints

### Authentication

- **POST `/register`** - Register a new user.
- **POST `/token`** - Authenticate and receive an access token.

### User Management

- **GET `/users`** - Retrieve a list of users (Admin access required).
- **PUT `/user/{user_id}`** - Update a user by ID.
- **DELETE `/user/{user_id}`** - Delete a user by ID.

### Exam Management

- **POST `/exam/`** - Create a new exam.
- **GET `/exam/{exam_id}`** - Retrieve an exam by ID.
- **PUT `/exam/{exam_id}`** - Update an exam by ID.
- **DELETE `/exam/{exam_id}`** - Delete an exam by ID.
- **GET `/exams/`** - Retrieve all exams.

### Question Management

- **POST `/exam/{exam_id}/question/`** - Create a new question within an exam.
- **GET `/exam/{exam_id}/question/{question_id}`** - Retrieve a specific question.
- **PUT `/exam/{exam_id}/question/{question_id}`** - Update a question by ID.
- **DELETE `/exam/{exam_id}/question/{question_id}`** - Delete a question by ID.
- **GET `/exams/{exam_id}/questions`** - Retrieve all questions for a specific exam.

### Choice Management

- **POST `/exam/{exam_id}/question/{question_id}/choice/`** - Add a choice to a question.
- **GET `/exam/{exam_id}/question/{question_id}/choice/{choice_id}`** - Retrieve a specific choice.
- **PUT `/exam/{exam_id}/question/{question_id}/choice/{choice_id}`** - Update a choice by ID.
- **DELETE `/exam/{exam_id}/question/{question_id}/choice/{choice_id}`** - Delete a choice by ID.
- **GET `/exam/{exam_id}/question/{question_id}/choices`** - Retrieve all choices for a specific question.

### Image Management

- **POST `/upload/`** - Upload an image file.
- **GET `/static/{filename}`** - Retrieve a static image file.
- **DELETE `/delete-image/{filename}`** - Delete an image by filename.

## Usage

1. Start the backend server using Uvicorn.
2. Run the frontend server with React.
3. Register a new user and log in to access the application.
4. Use the endpoints to manage exams, questions, choices.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License.
