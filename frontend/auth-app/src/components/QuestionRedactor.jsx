import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const MAX_QUESTION_LENGTH = 255;
const MAX_CHOICE_LENGTH = 100;

const QuestionRedactor = () => {
    const [token] = useContext(UserContext);
    const [questions, setQuestions] = useState([]);
    const { examId } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    // Fetch existing questions when the component mounts
    useEffect(() => {
        fetchQuestions();
    }, [token, examId]);

     const fetchQuestions = async () => {
        try {
            const response = await fetch(`http://localhost:8000/exams/${examId}/questions`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const formattedQuestions = data.map(question => ({
                    id: question.id,
                    questionText: question.question_text,
                    choices: question.choices,
                    is_multiple_choice: question.is_multiple_choice,
                    image: question.image_path ? question.image_path : null,
                    imagePreview: question.image_path ? `${question.image_path}` : null,
                }));
                setQuestions(formattedQuestions);
                addNotification("Questions loaded successfully!", "success");
            } else {
                const errorData = await response.json();
                addNotification(`Error: ${errorData.detail || "No existing questions were found"}`, "error");
            }
        } catch (error) {
            addNotification(`An error occurred while fetching questions: ${error.message}`, "error");
        }
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            id: null,
            questionText: "",
            choices: [{ choice_text: "", is_correct: false }],
            is_multiple_choice: true,
            image: null,
            imagePreview: null,
        }]);
        addNotification("Question added", "info");
    };

    const handleQuestionChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index].questionText = value;
        setQuestions(newQuestions);
    };

    const handleAddChoice = (questionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices.push({ choice_text: "", is_correct: false });
        setQuestions(newQuestions);
        addNotification("Choice added", "info");
    };

    const handleChoiceChange = (questionIndex, choiceIndex, field, value) => {
        const newQuestions = [...questions];

        if (!newQuestions[questionIndex].is_multiple_choice && field === "is_correct") {
            // If single choice, deselect other choices
            newQuestions[questionIndex].choices.forEach((choice, index) => {
                if (index !== choiceIndex) {
                    choice.is_correct = false;
                }
            });
        }

        newQuestions[questionIndex].choices[choiceIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleQuestionTypeChange = (questionIndex, isMultipleChoice) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].is_multiple_choice = isMultipleChoice;

        // If changing to single choice, reset all correct choices
        if (!isMultipleChoice) {
            newQuestions[questionIndex].choices.forEach(choice => {
                choice.is_correct = false;
            });
        }

        setQuestions(newQuestions);
    };

    const handleRemoveChoice = (questionIndex, choiceIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices.splice(choiceIndex, 1);
        setQuestions(newQuestions);
        addNotification("Choice removed", "info");
    };

    const handleRemoveQuestion = async (index) => {
        const questionId = questions[index].id;
        if (questionId) {
            try {
                const response = await fetch(`http://localhost:8000/exam/${examId}/question/${questionId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to delete question from the database");
                }
                addNotification("Question deleted successfully!", "success");
            } catch (error) {
                addNotification(`Error: ${error.message}`, "error");
                return;
            }
        }

        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const validateQuestions = () => {
        for (const question of questions) {
            if (!question.questionText.trim()) {
                addNotification("Question text cannot be empty", "error");
                return false;
            }
            if (question.questionText.length > MAX_QUESTION_LENGTH) {
                addNotification(`Question text cannot exceed ${MAX_QUESTION_LENGTH} characters`, "error");
                return false;
            }
            if (question.choices.length === 0) {
                addNotification("At least one choice is required", "error");
                return false;
            }

            const allChoicesEmpty = question.choices.every(choice => !choice.choice_text.trim());
            if (allChoicesEmpty) {
                addNotification("All choices cannot be empty", "error");
                return false;
            }

            for (const choice of question.choices) {
                if (choice.choice_text.length > MAX_CHOICE_LENGTH) {
                    addNotification(`Choice text cannot exceed ${MAX_CHOICE_LENGTH} characters`, "error");
                    return false;
                }
            }

            const hasCorrectChoice = question.choices.some(choice => choice.is_correct);
            if (!hasCorrectChoice) {
                addNotification("At least one choice must be marked as correct", "error");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        const confirmSave = window.confirm("Do you really want to save the questions?");
        if (!confirmSave) return;

        if (!validateQuestions()) return;

        try {
            for (const question of questions) {
                // If there's an image, upload it first
                let imageUrl = null;
                if (question.image) {
                    const formData = new FormData();
                    formData.append("file", question.image);

                    const uploadResponse = await fetch("http://localhost:8000/upload/", {
                        method: "POST",
                        body: formData,
                    });

                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        addNotification(`Error uploading image: ${errorData.detail || "Upload failed"}`, "error");
                        return;
                    }

                    const imageData = await uploadResponse.json();
                    imageUrl = imageData.filename ? `http://localhost:8000/static/${imageData.filename}` : null;
                }

                const requestOptions = {
                    method: question.id ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        question_text: question.questionText,
                        choices: question.choices,
                        is_multiple_choice: question.is_multiple_choice,
                        image_path: imageUrl, // Add the image URL to the request
                    }),
                };

                const url = question.id
                    ? `http://localhost:8000/exam/${examId}/question/${question.id}`
                    : `http://localhost:8000/exam/${examId}/question`;

                const response = await fetch(url, requestOptions);
                if (!response.ok) {
                    const errorData = await response.json();
                    addNotification(`Error: ${errorData.detail || "Failed to create or update question"}`, "error");
                    return;
                }
            }
            addNotification("Questions saved successfully!", "success");
            navigate(`/exam/${examId}`);
        } catch (error) {
            addNotification(`An error occurred while saving questions: ${error.message}`, "error");
        }
    };

    const handleGoBack = () => {
        if (window.confirm("Are you sure you want to go back? Unsaved changes will be lost.")) {
            navigate('/');
        }
    };

    const handleImageChange = (questionIndex, file) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].image = file; // Store the uploaded file in state
        newQuestions[questionIndex].imagePreview = URL.createObjectURL(file); // Create a preview URL
        setQuestions(newQuestions);
        addNotification("Image uploaded successfully!", "info");
    };

   const handleImageCancel = async (questionIndex) => {
        const question = questions[questionIndex];
        if (question.image) {
            const filename = typeof question.image === 'string' ? question.image.split('/').pop() : null;
            if (filename) {
                try {
                    const response = await fetch(`http://localhost:8000/delete-image/${filename}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || "Failed to delete image from the backend");
                    }

                    const newQuestions = [...questions];
                    newQuestions[questionIndex].image = null;
                    newQuestions[questionIndex].imagePreview = null;
                    setQuestions(newQuestions);
                    addNotification("Image deleted successfully", "info");
                } catch (error) {
                    addNotification(`Error: ${error.message}`, "error");
                }
            }else {
                const newQuestions = [...questions];
                newQuestions[questionIndex].image = null;
                newQuestions[questionIndex].imagePreview = null;
                setQuestions(newQuestions);
                addNotification("Image deleted successfully", "info");
            }
        } else {
            const newQuestions = [...questions];
            newQuestions[questionIndex].image = null;
            newQuestions[questionIndex].imagePreview = null;
            setQuestions(newQuestions);
            addNotification("Image deleted successfully", "info");
        }
    };

    return (
        <div className="container">
            <div className="buttons">
                <button className="button is-primary" onClick={handleAddQuestion}>
                    Add Another Question
                </button>
                <button className="button is-link" onClick={handleSubmit}>
                    Save Questions
                </button>
                <button className="button is-warning" onClick={handleGoBack}>
                    Go Back
                </button>
            </div>
            <h2 className="title">Redact Questions for Exam {examId}</h2>
            <div className="form-container">
                {questions.map((question, questionIndex) => (
                    <div key={question.id || questionIndex} className="question-block day-card"
                         style={{marginBottom: '20px'}}>
                        <div className="field">
                            <label className="label">Question Text</label>
                            <input
                                className="input"
                                type="text"
                                value={question.questionText}
                                onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                                placeholder="Enter the question"
                            />
                        </div>

                        <div className="field">
                            <label className="label">Question Type</label>
                            <div className="control">
                                <label className="radio">
                                    <input
                                        type="radio"
                                        value="multiple"
                                        checked={question.is_multiple_choice}
                                        onChange={() => handleQuestionTypeChange(questionIndex, true)}
                                    />
                                    Multiple Choice
                                </label>
                                <br/>
                                <label className="radio">
                                    <input
                                        type="radio"
                                        value="single"
                                        checked={!question.is_multiple_choice}
                                        onChange={() => handleQuestionTypeChange(questionIndex, false)}
                                    />
                                    Single Choice
                                </label>
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Upload Image</label>
                            {!question.imagePreview && (
                                <div>
                                    <button
                                        className="button is-primary"
                                        onClick={() => document.getElementById(`file-input-${questionIndex}`).click()}
                                    >
                                        Upload Image
                                    </button>
                                    <input
                                        type="file"
                                        id={`file-input-${questionIndex}`}
                                        accept="image/*"
                                        style={{display: 'none'}} // Hide the input
                                        onChange={(e) => handleImageChange(questionIndex, e.target.files[0])}
                                    />
                                </div>
                            )}
                            {question.imagePreview && (
                                <div className="image-preview">
                                    <img src={question.imagePreview} alt="Preview"
                                         style={{width: '100px', height: 'auto', marginTop: '10px'}}/>
                                    <button className="button is-danger"
                                            onClick={() => handleImageCancel(questionIndex)}
                                            style={{marginLeft: '10px'}}>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {question.choices.map((choice, choiceIndex) => (
                            <div key={choiceIndex} className="field choice-block">
                                <label className="label">{choiceIndex + 1})</label>
                                <input
                                    className="input choice-input"
                                    type="text"
                                    style={{marginLeft: "10px"}}
                                    value={choice.choice_text}
                                    onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, "choice_text", e.target.value)}
                                    placeholder="Enter choice"
                                />
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={choice.is_correct}
                                        onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, "is_correct", e.target.checked)}
                                    />
                                    Correct
                                </label>
                                <button
                                    className="button is-danger"
                                    onClick={() => handleRemoveChoice(questionIndex, choiceIndex)}
                                    style={{marginLeft: "6px"}}
                                >
                                    X
                                </button>
                            </div>
                        ))}

                        <button className="button is-primary" onClick={() => handleAddChoice(questionIndex)}>
                            Add choice
                        </button>
                        <button className="button is-danger" onClick={() => handleRemoveQuestion(questionIndex)}
                                style={{marginLeft: "10px"}}>
                            Remove Question
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuestionRedactor;
