import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext"; // Import useNotification hook

const Login = ({ toggleForm }) => {
  const [Username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [,,,,setToken] = useContext(UserContext); // Correctly destructuring token, userRole, and setToken
  const { addNotification } = useNotification(); // Get addNotification function from context

  const submitLogin = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: Username,
        password: password,
      }),
    };

    const response = await fetch("http://localhost:8000/token", requestOptions);
    const data = await response.json();

    if (!response.ok) {
      addNotification(data.detail, "error"); // Show error notification
    } else {
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      addNotification("Login successful!", "success"); // Show success notification
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitLogin();
  };

  return (
    <div className="column is-half is-offset-one-quarter">
      <form className="box" onSubmit={handleSubmit}>
        <h1 className="title has-text-centered">Login</h1>

        <div className="field">
          <label className="label">Username</label>
          <div className="control">
            <input
              type="text"
              placeholder="Enter username"
              value={Username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <br />
        <div className="has-text-centered">
          <button className="button is-primary" type="submit">
            Login
          </button>
        </div>

        <br />
        <div className="has-text-centered">
          <p>
            Don't have an account?{" "}
            <a href="#" onClick={toggleForm}>
              Register here
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
