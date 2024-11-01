import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

export const UserProvider = (props) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userId, setUserId] = useState(null);
    const [exp, setExp] = useState(null);

    useEffect(() => {
        const decodeToken = (token) => {
            try {
                const payloadBase64 = token.split(".")[1];
                const decodedPayload = JSON.parse(atob(payloadBase64));
                return {
                    userId: decodedPayload.id,
                    userName: decodedPayload.username,
                    userRole: decodedPayload.role,
                    exp: decodedPayload.exp
                };
            } catch (error) {
                console.error("Failed to decode token:", error);
                return null;
            }
        };

        const refreshToken = async () => {
            try {
                const response = await fetch(`http://localhost:8000/refresh-token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setToken(data.access_token);
                    localStorage.setItem("token", data.access_token);
                    const decoded = decodeToken(data.access_token);
                    if (decoded) {
                        setExp(decoded.exp);
                    }
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error("Failed to refresh token:", error);
                handleLogout();
            }
        };

        const handleLogout = () => {
            setToken(null);
            setUserRole(null);
            setUserName(null);
            setUserId(null);
            setExp(null);
            localStorage.removeItem("token");
        };

        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUserRole(decoded.userRole);
                setUserName(decoded.userName);
                setUserId(decoded.userId);
                setExp(decoded.exp);
            } else {
                handleLogout();
            }
        }

        const intervalId = setInterval(() => {
            if (exp && Date.now() >= exp * 1000 - 60 * 1000) {
                refreshToken();
            }
        }, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [token, exp]);

    return (
        <UserContext.Provider value={[ token, userRole, userName, userId, setToken ]}>
            {props.children}
        </UserContext.Provider>
    );
};
