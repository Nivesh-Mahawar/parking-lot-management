import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getAllBookings } from "../api/api";

function formatDateTime(value) {
  // value is a plain "YYYY-MM-DD HH:MM:SS" string - display it as-is,
  // just reformatted slightly, with no timezone conversion.
  return value;
}

function statusBadgeClass(status) {
  if (status === "booked") return "available";
  return "occupied"; // cancelled / completed
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    try {
      const data = await getAllBookings();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Could not load bookings.");
    }
  }, []);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 5000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  return (
    <div>
      <Navbar title="All Customer Bookings" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        {error && <div className="error-msg">{error}</div>}

        {bookings.length === 0 ? (
          <div className="info-msg">No customer bookings yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Slot</th>
                <th>Vehicle</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.username}</td>
                  <td>#{b.slot_number}</td>
                  <td>
                    {b.vehicle_number} ({b.vehicle_type})
                  </td>
                  <td>{formatDateTime(b.start_time)}</td>
                  <td>{formatDateTime(b.end_time)}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(b.status)}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
