import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getMyBookings, cancelBooking } from "../api/api";

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

function statusBadgeClass(status) {
  if (status === "booked") return "available"; // reuse green badge style
  if (status === "cancelled") return "occupied"; // reuse red badge style
  return "occupied";
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const loadBookings = useCallback(async () => {
    try {
      const data = await getMyBookings(userId);
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Could not load your bookings.");
    }
  }, [userId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleCancel(bookingId) {
    setMessage(null);
    try {
      const data = await cancelBooking(bookingId, userId);
      if (data.success) {
        setMessage({ type: "success", text: "Booking cancelled." });
        loadBookings();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error while cancelling." });
    }
  }

  const now = new Date();

  return (
    <div>
      <Navbar title="My Bookings" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/customer")}>
          ← Back to Dashboard
        </button>

        {error && <div className="error-msg">{error}</div>}
        {message && <div className={`${message.type}-msg`}>{message.text}</div>}

        {bookings.length === 0 ? (
          <div className="info-msg">You haven't booked any slots yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Slot</th>
                <th>Vehicle</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const canCancel = b.status === "booked" && new Date(b.start_time) > now;
                return (
                  <tr key={b.id}>
                    <td>#{b.slot_number}</td>
                    <td>
                      {b.vehicle_number} ({b.vehicle_type})
                    </td>
                    <td>{formatDateTime(b.start_time)}</td>
                    <td>{formatDateTime(b.end_time)}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(b.status)}`}>{b.status}</span>
                    </td>
                    <td>
                      {canCancel && (
                        <button className="secondary-btn" onClick={() => handleCancel(b.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
