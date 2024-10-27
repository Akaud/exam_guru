import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeadModal from "./LeadModal";
import { UserContext } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext";

const Table = () => {
  const [token, userRole, userName, userId] = useContext(UserContext);
  const [exams, setExams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState(false);
  const [id, setId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleRedact = (id) => navigate(`/exam/${id}/questions`);
  const handleTakeExam = (id) => navigate(`/exam/${id}/take`);
  const handleUpdate = (id) => {
    setId(id);
    setActiveModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(`http://localhost:8000/exam/${id}`, requestOptions);
      if (!response.ok) throw new Error("Failed to delete exam");

      addNotification("Exam deleted successfully!", "success");
      getExams();
    } catch (error) {
      addNotification(error.message, "error");
    }
  };

  const getExams = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch("http://localhost:8000/exams", requestOptions);
      if (!response.ok) throw new Error("Could not load exams");

      const data = await response.json();
      setExams(Array.isArray(data) ? data : []);
      setLoaded(true);
      addNotification("Exams loaded successfully!", "success");
    } catch (error) {
      addNotification(error.message, "error");
      setLoaded(true); // Set loaded to true even on error for user feedback
    }
  };

  useEffect(() => {
    getExams();
  }, [token]);

  const handleModal = () => {
    setActiveModal(!activeModal);
    getExams();
    setId(null);
  };

  const filteredExams = exams.filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <LeadModal active={activeModal} handleModal={handleModal} token={token} id={id} />

      <div className="user-info mb-5">
        <h4>Welcome, {userRole} {userName}!</h4>
      </div>

      {userRole !== "student" && (
        <div className="has-text-centered">
          <button className="button is-success create-exam-button mb-5" onClick={() => setActiveModal(true)}>
            Create Exam
          </button>
        </div>
      )}

      <div className="search-bar mb-5 has-text-centered">
        <input
          type="text"
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input is-medium"
        />
      </div>

      {loaded ? (
        <div className="columns is-multiline">
          {filteredExams.map(exam => (
            <div className="column is-one-quarter" key={exam.id}>
              <div className="day-card">
                <h3 className="day-name exam-title">{exam.title}</h3>
                <p className="day-date exam-description">{exam.description}</p>
                <p>Number of Questions: {exam.num_questions}</p>

                {exam.image && (
                  <img
                    src={`http://localhost:8000/images/${exam.image}`} // Adjusted image URL to match FastAPI route
                    alt={exam.title}
                    style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
                  />
                )}

                <div className="event-actions">
                  {userRole !== "student" && exam.owner_id === userId && (
                    <>
                      <button className="button is-info is-light" onClick={() => handleUpdate(exam.id)}>Update</button>
                      <button className="button is-danger is-light" onClick={() => handleDelete(exam.id)}>Delete</button>
                      <button className="button is-primary is-light" onClick={() => handleRedact(exam.id)}>Redact</button>
                    </>
                  )}

                  {exam.num_questions > 0 && (
                    <button className="button is-success is-light" onClick={() => handleTakeExam(exam.id)}>Take Exam</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading</p>
      )}
    </>
  );
};

export default Table;
