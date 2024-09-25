import React, { useContext, useState } from "react";

import { UserContext } from "../context/UserContext";
import ErrorMessage from "./ErrorMessage";

const Register = () => {
    const [Username, setUsername] = useState("");
    const [Name, setName] = useState("");
    const [Surname, setSurname] = useState("");
    const [Role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmationPassword, setConfirmationPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [, setToken] = useContext(UserContext);

  const submitRegistration = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
          {
            username:Username,
            email:email,
            password:password,
            name:Name,
            surname:Surname,
            role:Role}),
    };

    const response = await fetch("http://localhost:8000/register", requestOptions);
    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.detail);
    } else {
            const formDetails = new URLSearchParams();
            formDetails.append('username', Username);
            formDetails.append('password', password);
      try {
          const response = await fetch('http://localhost:8000/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formDetails,
          });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
      } else {
        setErrorMessage(data.detail);
      }
    } catch (error) {
      setErrorMessage(data.detail);
    }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === confirmationPassword && password.length > 5) {
      submitRegistration();
    } else {
      setErrorMessage(
        "Ensure that the passwords match and greater than 5 characters"
      );
    }
  };

  return (
      <div className="column is-half is-offset-one-quarter">
          <form className="box" onSubmit={handleSubmit}>
              <h1 className="title has-text-centered">Register</h1>

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

              <div className="field is-grouped">
                  <div className="control is-expanded">
                      <label className="label">Name</label>
                      <input
                          type="text"
                          placeholder="Enter name"
                          value={Name}
                          onChange={(e) => setName(e.target.value)}
                          className="input"
                          required
                      />
                  </div>
                  <div className="control is-expanded">
                      <label className="label">Surname</label>
                      <input
                          type="text"
                          placeholder="Enter surname"
                          value={Surname}
                          onChange={(e) => setSurname(e.target.value)}
                          className="input"
                          required
                      />
                  </div>
              </div>

              <div className="field">
                  <label className="label">Email Address</label>
                  <div className="control">
                      <input
                          type="email"
                          placeholder="Enter email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input"
                          required
                      />
                  </div>
              </div>

              <div className="field">
                  <label className="label">Role</label>
                  <div className="control">
                      <label className="radio">
                          <input
                              type="radio"
                              name="role"
                              value="student"
                              checked={Role === "student"}
                              onChange={(e) => setRole(e.target.value)}
                          /> Student
                      </label>
                      <label className="radio">
                          <input
                              type="radio"
                              name="role"
                              value="teacher"
                              checked={Role === "teacher"}
                              onChange={(e) => setRole(e.target.value)}
                          /> Teacher
                      </label>
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

              <div className="field">
                  <label className="label">Confirm Password</label>
                  <div className="control">
                      <input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmationPassword}
                          onChange={(e) => setConfirmationPassword(e.target.value)}
                          className="input"
                          required
                      />
                  </div>
              </div>

              <ErrorMessage message={errorMessage}/>

              <br/>

              <button className="button is-primary" type="submit">
                  Register
              </button>
          </form>
      </div>

  );
};

export default Register;