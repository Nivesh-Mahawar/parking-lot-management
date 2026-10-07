import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const actions = [
    { icon: "🎟️", label: "Book a Slot", path: "/book" },
    { icon: "📑", label: "My Bookings", path: "/my-bookings" },
  ];

  return (
    <div>
      <Navbar title="My Parking" />
      <div className="page-wrapper">
        <p style={{ marginBottom: 24, color: "#374151" }}>Welcome back, {username}! 👋</p>

        <div className="action-grid">
          {actions.map((a) => (
            <button key={a.path} className="action-card" onClick={() => navigate(a.path)}>
              <span className="icon">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
