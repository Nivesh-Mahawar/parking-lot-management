import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Dashboard() {
  const navigate = useNavigate();

  const actions = [
    { icon: "🚗", label: "Park Vehicle", path: "/park" },
    { icon: "🚦", label: "Exit Vehicle", path: "/exit" },
    { icon: "📋", label: "Parking Status", path: "/status" },
    { icon: "🔍", label: "Search Vehicle", path: "/search" },
    { icon: "⏳", label: "Waiting Queue", path: "/queue" },
    { icon: "🎟️", label: "Customer Bookings", path: "/admin-bookings" },
    { icon: "🛠️", label: "Manage Slots", path: "/manage-slots" },
  ];

  return (
    <div>
      <Navbar title="Dashboard" />
      <div className="page-wrapper">
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
