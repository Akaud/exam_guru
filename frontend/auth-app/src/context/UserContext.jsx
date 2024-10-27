import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

export const UserProvider = (props) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [userRole, setUserRole] = useState(null);  // State for storing the user role
    const [userName, setUserName] = useState(null);  // New state for storing the user name
    const [userId, setUserId] = useState(null);  // New state for storing the user name

    useEffect(() => {
        const fetchUser = async () => {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            };
            const response = await fetch(`http://localhost:8000/verify-token/${token}`, requestOptions);
            if (response.ok) {
                const data = await response.json();
                setUserRole(data.role);  // Set the role from the API response
                setUserName(data.name);  // Set the name from the API response
                setUserId(data.user_id);
            } else {
                setToken(null);
                setUserRole(null);
                setUserName(null);  // Clear name on error
                setUserId(null);
            }
            localStorage.setItem("token", token);
        };
        if (token) {
            fetchUser();
        }
    }, [token]);

    return (
        <UserContext.Provider value={[token, userRole, userName,userId, setToken]}>
            {props.children}
        </UserContext.Provider>
    );
};
