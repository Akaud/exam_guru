import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';

const ExamTaker = () => {
  const [token] = useContext(UserContext);
  const { addNotification } = useNotification();
  const [questions, setQuestions] = useState([]);
  const [choices, setChoices] = useState({});
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [totalScore, setTotalScore] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { examId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/exam/${examId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setExamTitle(data.title);
          fetchQuestions();
        } else {
          addNotification('Failed to load exam details', 'error');
        }
      } catch (error) {
        addNotification('An error occurred while fetching exam details', 'error');
      }
    };

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://localhost:8000/exams/${examId}/questions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
          data.forEach(question => fetchChoices(question.id));
        } else {
          addNotification('Failed to load exam questions', 'error');
        }
      } catch (error) {
        addNotification('An error occurred while fetching questions', 'error');
      }
    };

    const fetchChoices = async (questionId) => {
      try {
        const response = await fetch(`http://localhost:8000/exam/${examId}/question/${questionId}/choices`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setChoices(prevChoices => ({ ...prevChoices, [questionId]: data }));
        } else {
          addNotification(`Failed to load choices for question ID: ${questionId}`, 'error');
        }
      } catch (error) {
        addNotification(`An error occurred while fetching choices for question ID: ${questionId}`, 'error');
      }
    };
    fetchExamDetails()
  }, [examId, token, addNotification]);

  const handleAnswerChange = (questionId, choiceIndex) => {
    if (!isSubmitted) {
      setAnswers(prevAnswers => {
        const currentAnswers = prevAnswers[questionId] || [];
        if (currentAnswers.includes(choiceIndex)) {
          return { ...prevAnswers, [questionId]: currentAnswers.filter(index => index !== choiceIndex) };
        } else {
          return { ...prevAnswers, [questionId]: [...currentAnswers, choiceIndex] };
        }
      });
    }
  };

  const handleSubmit = () => {
    const newFeedback = questions.map(question => {
      const userAnswerIndexes = answers[question.id] || [];
      const correctIndexes = choices[question.id]
        ?.map((choice, index) => (choice.is_correct ? index : -1))
        .filter(index => index !== -1);

      const correctCount = userAnswerIndexes.filter(index => correctIndexes.includes(index)).length;
      const totalCorrectChoices = correctIndexes.length;
      const questionScore = totalCorrectChoices > 0 ? correctCount / totalCorrectChoices : 0;

      const isCorrect = question.is_multiple_choice
        ? questionScore === 1
        : userAnswerIndexes[0] === correctIndexes[0];

      const isPartiallyCorrect = question.is_multiple_choice && questionScore > 0 && questionScore < 1;

      return {
        questionId: question.id,
        isCorrect: isCorrect,
        isPartiallyCorrect: isPartiallyCorrect,
        chosen: userAnswerIndexes,
        correct: correctIndexes,
        questionScore: questionScore,
      };
    });

    const totalScore = (newFeedback.reduce((sum, feedbackItem) => sum + feedbackItem.questionScore, 0) / questions.length) * 100;

    setFeedback(newFeedback);
    setTotalScore(totalScore);
    setIsSubmitted(true);
    addNotification(`Exam submitted! Your score: ${totalScore.toFixed(2)}%`, 'success');
  };

  const handleGoBack = () => {
    const confirmLeave = window.confirm('Are you sure you want to leave the exam? Your answers will not be saved.');
    if (confirmLeave) {
      navigate(-1);
    }
  };

  return (
    <div className="container">
      <h2 className="title">{examTitle || 'Loading...'}</h2>
      {questions.length === 0 ? (
        <p>Loading questions...</p>
      ) : (
        questions.map((question, index) => (
          <div key={question.id} className="question-block day-card wide-card" style={{ marginBottom: '20px' }}>
            <h3>{index + 1}. {question.question_text}</h3>
            {question.image_path && (
              <img
                src={question.image_path}
                alt={`Image for question ${index + 1}`}
                style={{ maxWidth: '100%', height: 'auto', marginBottom: '10px' }}
              />
            )}
            {choices[question.id] ? choices[question.id].map((choice, choiceIndex) => {
              let choiceClass = '';

              if (feedback.length > 0) {
                const feedbackItem = feedback.find(f => f.questionId === question.id);
                if (feedbackItem) {
                  const isChosen = Array.isArray(answers[question.id]) && answers[question.id].includes(choiceIndex);
                  const isCorrectChoice = feedbackItem.correct.includes(choiceIndex);
                  choiceClass = isCorrectChoice ? 'correct' : isChosen ? 'incorrect' : '';
                }
              }

              return (
                <div key={choice.id} className={`choice ${choiceClass}`} style={{ marginBottom: '10px' }}>
                  <label className="checkbox">
                    <input
                      type={question.is_multiple_choice ? 'checkbox' : 'radio'}
                      name={question.id}
                      checked={Array.isArray(answers[question.id]) ? answers[question.id].includes(choiceIndex) : answers[question.id] === choiceIndex}
                      onChange={() => handleAnswerChange(question.id, choiceIndex)}
                      disabled={isSubmitted}
                    />
                    {choice.choice_text}
                  </label>
                </div>
              );
            }) : <p>Loading choices...</p>}
          </div>
        ))
      )}
      <div className="buttons">
        <button className="button is-danger" onClick={handleGoBack}>
          Go Back
        </button>
        <button className="button is-success" onClick={handleSubmit}>
          Check Answers
        </button>
      </div>

      {totalScore !== null && (
        <div className="result">
          <h3>Your Score: {totalScore.toFixed(2)}%</h3>
          <h4>Feedback:</h4>
          <ul>
            {feedback.map((f, index) => (
              <li key={index}>
                Question {index + 1}: {f.isCorrect ? 'Correct' : f.isPartiallyCorrect ? 'Partially Correct' : 'Incorrect'}
                (Your answer: {f.chosen.length > 0 ? f.chosen.map(idx => choices[questions[index].id][idx]?.choice_text).join(', ') : 'None'},
                Correct answer: {f.correct.length > 0 ? f.correct.map(idx => choices[questions[index].id][idx]?.choice_text).join(', ') : 'None'} )
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExamTaker;
