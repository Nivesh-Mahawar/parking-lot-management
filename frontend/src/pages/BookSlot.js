import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getAvailableSlots, createBooking } from "../api/api";

// Default to "an hour from now" -> "two hours from now" so the form isn't empty
function defaultDateTimeLocal(offsetMinutes) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  d.setSeconds(0, 0);
  // toISOString gives UTC; datetime-local inputs want local time without a Z.
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffsetMs).toISOString().slice(0, 16);
}

// Converts a <input type="datetime-local"> value ("2026-10-06T12:41") into a
// plain MySQL DATETIME string ("2026-10-06 12:41:00") WITHOUT any UTC
// conversion. We want the exact wall-clock numbers the user picked to be
// what gets stored and displayed - no timezone math at all.
function toMySQLDateTime(datetimeLocalValue) {
  return datetimeLocalValue.replace("T", " ") + ":00";
}

export default function BookSlot() {
  const [startTime, setStartTime] = useState(defaultDateTimeLocal(60));
  const [endTime, setEndTime] = useState(defaultDateTimeLocal(180));
  const [slots, setSlots] = useState(null); // null = not checked yet
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [message, setMessage] = useState(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  async function handleCheckAvailability(e) {
    e.preventDefault();
    setMessage(null);
    setSelectedSlot(null);

    if (!startTime || !endTime) {
      setMessage({ type: "error", text: "Please choose both a start and end time." });
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setMessage({ type: "error", text: "End time must be after start time." });
      return;
    }

    setChecking(true);
    try {
      const data = await getAvailableSlots(toMySQLDateTime(startTime), toMySQLDateTime(endTime));
      if (data.success) {
        setSlots(data.slots);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error while checking availability." });
    } finally {
      setChecking(false);
    }
  }

  async function handleConfirmBooking() {
    setMessage(null);

    if (!selectedSlot) {
      setMessage({ type: "error", text: "Please select a slot from the grid first." });
      return;
    }
    if (!vehicleNumber.trim()) {
      setMessage({ type: "error", text: "Please enter your vehicle number." });
      return;
    }

    setBooking(true);
    try {
      const data = await createBooking({
        userId: localStorage.getItem("userId"),
        slotNumber: selectedSlot,
        vehicleNumber: vehicleNumber.trim(),
        vehicleType,
        startTime: toMySQLDateTime(startTime),
        endTime: toMySQLDateTime(endTime),
      });

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setTimeout(() => navigate("/my-bookings"), 1200);
      } else {
        setMessage({ type: "error", text: data.message });
        // Someone else may have grabbed it - refresh the grid
        handleCheckAvailability({ preventDefault: () => {} });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error while booking." });
    } finally {
      setBooking(false);
    }
  }

  return (
    <div>
      <Navbar title="Book a Slot" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/customer")}>
          ← Back to Dashboard
        </button>

        <div className="card-form" style={{ maxWidth: 560 }}>
          {message && <div className={`${message.type}-msg`}>{message.text}</div>}

          <form onSubmit={handleCheckAvailability}>
            <div className="form-group">
              <label>From</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <button className="primary-btn" type="submit" disabled={checking}>
              {checking ? "Checking..." : "Check Availability"}
            </button>
          </form>
        </div>

        {slots && (
          <>
            <p style={{ marginTop: 24 }}>
              🟩 Available &nbsp;&nbsp; 🟥 Taken for this time &nbsp;&nbsp; 🔵 Selected — pick your spot below:
            </p>

            <div className="seat-grid">
              {slots.map((s) => {
                const isSelected = selectedSlot === s.slot_number;
                const cls = !s.available ? "taken" : isSelected ? "selected" : "free";
                return (
                  <button
                    key={s.slot_number}
                    className={`seat-box ${cls}`}
                    disabled={!s.available}
                    onClick={() => setSelectedSlot(s.slot_number)}
                    title={s.available ? `Slot ${s.slot_number} - available` : `Slot ${s.slot_number} - taken`}
                  >
                    🚗
                    <span className="seat-label">#{s.slot_number}</span>
                  </button>
                );
              })}
            </div>

            {selectedSlot && (
              <div className="card-form" style={{ marginTop: 24, maxWidth: 560 }}>
                <h3 style={{ marginTop: 0 }}>Confirm booking for Slot #{selectedSlot}</h3>

                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TS09AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option>Car</option>
                    <option>Bike</option>
                    <option>Truck</option>
                    <option>Bus</option>
                    <option>Other</option>
                  </select>
                </div>

                <button className="primary-btn" onClick={handleConfirmBooking} disabled={booking}>
                  {booking ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
