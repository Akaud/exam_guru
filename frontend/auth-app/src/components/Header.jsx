import React, { useContext } from "react";
import { UserContext } from "../context/UserContext";

const Header = ({ title }) => {
  const [token, , , ,setToken] = useContext(UserContext);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <header>
      <div className="has-text-centered m-6">
        <h1 className="title">{title}</h1>
      </div>

      {/* Logout button outside the navbar */}
      {token ? (
        <div className="has-text-centered mb-5">
          <button className="button is-danger logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <></>
      )}
    </header>
  );
};

export default Header;
