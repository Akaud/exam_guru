// src/App.jsx
import React, { useContext, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Register from './components/Register.jsx';
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import { UserContext } from "./context/UserContext";
import Table from './components/Table';
import QuestionRedactor from './components/QuestionRedactor';
import ExamTaker from './components/ExamTaker';
import Footer from './components/Footer';
import './styles.css';

const App = () => {
  const [token] = useContext(UserContext);
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="app-container">
      <Header title={"Exam Guru"} />
      <div className="columns">
        <div className="column"></div>
        <div className="column m-5 is-two-thirds">
          {!token ? (
            <div className="columns">
              {isLogin ? (
                <Login toggleForm={() => setIsLogin(false)} />
              ) : (
                <Register toggleForm={() => setIsLogin(true)} />
              )}
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Table />} />
              <Route path="/exam/:examId/questions" element={<QuestionRedactor />} />
              <Route path="/exam/:examId/take" element={<ExamTaker />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </div>
        <div className="column"></div>
      </div>
      <Footer /> {/* Footer will always be at the bottom */}
    </div>
  );
};

export default App;
