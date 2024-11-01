import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeadModal from "./LeadModal";
import { UserContext } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon
} from "@heroicons/react/24/solid";

const Table = () => {
  const [token, userRole, userName, userId] = useContext(UserContext);
  const [exams, setExams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState(false);
  const [id, setId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("alphabetical");
  const [filterType, setFilterType] = useState("all");
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
      setLoaded(true);
    }
  };

  useEffect(() => {
    getExams();
  }, []);

  const handleModal = () => {
    setActiveModal(!activeModal);
    getExams();
    setId(null);
  };

  const sortedAndFilteredExams = exams
    .filter((exam) => {
      if (filterType === "myExams" && (userRole === "teacher"||userRole === "admin")) {
        return exam.owner_id === userId;
      } else if (filterType === "otherExams" && (userRole === "teacher"||userRole === "admin")) {
        return exam.owner_id !== userId;
      }
      return true;
    })
    .filter((exam) => exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === "reverse") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  return (
      <>
        <LeadModal active={activeModal} handleModal={handleModal} token={token} id={id}/>

        <div className="user-info mb-5">
          <h4>Welcome, {userRole} {userName}!</h4>
        </div>

        <div className="search-bar mb-3 has-text-centered">
          <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input is-medium"
          />
        </div>

        <div className="sort-filter-buttons mb-5 has-text-centered">
          <button className="button is-info" onClick={() => setSortOrder("alphabetical")}>
            <ArrowUpIcon className="icon mr-1" /> A -> Z
          </button>
          <button className="button is-info ml-2" onClick={() => setSortOrder("reverse")}>
            <ArrowDownIcon className="icon mr-1" /> Z -> A
          </button>

          {(userRole === "teacher" || userRole === "admin") && (
              <>
                <button className="button is-primary ml-2" onClick={() => setFilterType("myExams")}>
                  My Exams
                </button>
                <button className="button is-primary ml-2" onClick={() => setFilterType("otherExams")}>
                  Other People's Exams
                </button>
              </>
          )}

          <button className="button is-warning ml-2" onClick={() => setFilterType("all")}>
            All Exams
          </button>
        </div>

        {loaded ? (
            <div className="columns" style={{display: 'flex', flexWrap: 'wrap'}}>
              {sortedAndFilteredExams.map((exam) => (
                  <div className="column is-one-quarter" key={exam.id} style={{display: 'flex'}}>
                    <div className="day-card">
                      <h3 className="day-name exam-title">{exam.title}</h3>
                      <p className="day-date exam-description">{exam.description}</p>
                      <p>Number of Questions: {exam.num_questions}</p>

                      {exam.image && (
                          <img
                              src={`http://localhost:8000/images/${exam.image}`}
                              alt={exam.title}
                              style={{width: '100%', height: 'auto', marginBottom: '10px'}}
                          />
                      )}

                      <div className="event-actions">
                        {(userRole === "admin" || (userRole === "teacher" && exam.owner_id === userId)) && (
                            <>
                              <button className="button is-info is-light" onClick={() => handleUpdate(exam.id)}>
                                <CreditCardIcon className="icon mr-1" /> Update info
                              </button>
                              <button className="button is-danger is-light" onClick={() => handleDelete(exam.id)}>
                                <TrashIcon className="icon mr-1" /> Delete
                              </button>
                              <button className="button is-primary is-light" onClick={() => handleRedact(exam.id)}>
                                <PencilSquareIcon className="icon mr-1" /> Edit questions
                              </button>
                            </>
                        )}

                        {exam.num_questions > 0 && (
                            <button className="button is-success is-light" onClick={() => handleTakeExam(exam.id)}>
                              Take Exam
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
              ))}

              {userRole !== "student" && (
                  <div className="column is-one-quarter"
                       style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <div className="day-card is-flex is-justify-content-center is-align-items-center"
                         style={{cursor: 'pointer', height: '100%', textAlign: 'center', fontSize: '2rem'}}
                         onClick={() => setActiveModal(true)}>
                      <PlusCircleIcon className="icon mr-1" /> Add one more exam
                    </div>
                  </div>
              )}
            </div>
        ) : (
            <p>Loading</p>
        )}
      </>
  );
};

export default Table;
