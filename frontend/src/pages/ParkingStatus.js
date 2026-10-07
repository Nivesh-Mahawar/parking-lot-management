import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getStatus } from "../api/api";

export default function ParkingStatus() {
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setSlots(data.slots);
    } catch (err) {
      setError("Could not load parking status.");
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return (
    <div>
      <Navbar title="Parking Status" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        {error && <div className="error-msg">{error}</div>}

        <p>
          🟩 Available &nbsp;&nbsp; 🟥 Occupied &nbsp;&nbsp; ({slots.filter((s) => s.status === "available").length}{" "}
          of {slots.length} slots free)
        </p>

        <div className="slot-grid">
          {slots.map((slot) => (
            <div key={slot.id} className={`slot-box ${slot.status}`}>
              #{slot.slot_number}
              <span className="slot-label">{slot.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
