import React, { useEffect, useState } from "react";
import { useNotification } from "../context/NotificationContext";

const LeadModal = ({ active, handleModal, token, id }) => {
  const [exam, setExam] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const getExam = async () => {
      const requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      };

      const response = await fetch(`http://localhost:8000/exam/${id}/`, requestOptions);

      if (!response.ok) {
        addNotification("Could not get the exam", "error");
      } else {
        const data = await response.json();
        setExam(data.title);
        setDescription(data.description);
      }
    };

    if (id) {
      getExam();
    } else {
      cleanFormData(); // Clear form data if creating a new exam
    }
  }, [id, token]);

  const cleanFormData = () => {
    setExam("");
    setDescription("");
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading

    if (!exam.trim() || !description.trim()) {
      addNotification("Exam name and description cannot be empty.", "error");
      setLoading(false); // Stop loading
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Set content type for JSON
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        title: exam,
        description: description,
      }),
    };

    const response = await fetch("http://localhost:8000/exam/", requestOptions);
    setLoading(false); // Stop loading
    if (!response.ok) {
      const errorMessage = await response.json();
      addNotification("Something went wrong when creating exam: " + (errorMessage.detail || errorMessage), "error");
    } else {
      cleanFormData(); // Clear fields after successful creation
      addNotification("Exam created successfully!", "success");
      handleModal(); // Close the modal
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading

    if (!exam.trim() || !description.trim()) {
      addNotification("Exam name and description cannot be empty.", "error");
      setLoading(false); // Stop loading
      return;
    }

    const requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", // Set content type for JSON
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        title: exam,
        description: description,
      }),
    };

    const response = await fetch(`http://localhost:8000/exam/${id}`, requestOptions);
    setLoading(false); // Stop loading
    if (!response.ok) {
      const errorMessage = await response.json();
      addNotification("Something went wrong when updating exam: " + (errorMessage.detail || errorMessage), "error");
    } else {
      cleanFormData(); // Clear fields after successful update
      addNotification("Exam updated successfully!", "success");
      handleModal(); // Close the modal
    }
  };

  return (
    <div className={`modal ${active && "is-active"}`}>
      <div className="modal-background" onClick={() => {
        handleModal(); // Close modal and clean up
        cleanFormData(); // Clear the form when the modal is closed
      }}></div>
      <div className="modal-card">
        <header className="modal-card-head has-background-primary-light">
          <h1 className="modal-card-title">
            {id ? "Update Exam" : "Create Exam"}
          </h1>
        </header>
        <section className="modal-card-body">
          <form onSubmit={id ? handleUpdateExam : handleCreateExam}>
            <div className="field">
              <label className="label">Title</label>
              <div className="control">
                <input
                  type="text"
                  placeholder="Enter exam name"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Description</label>
              <div className="control">
                <input
                  type="text"
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>
            <footer className="modal-card-foot has-background-primary-light">
              <button className={`button ${id ? "is-info" : "is-primary"}`} type="submit" disabled={loading}>
                {loading ? "Saving..." : (id ? "Update" : "Create")}
              </button>
              <button className="button" style={{ marginLeft: "10px" }} onClick={() => {
                handleModal(); // Close the modal
                cleanFormData(); // Clear the form when the modal is closed
              }}>
                Cancel
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LeadModal;
