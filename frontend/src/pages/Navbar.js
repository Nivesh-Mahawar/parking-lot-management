import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ title }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  }

  return (
    <div className="navbar">
      <h2>🅿️ {title}</h2>
      <button className="secondary-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
