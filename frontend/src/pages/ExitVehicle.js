import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { exitVehicle } from "../api/api";

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

export default function ExitVehicle() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [message, setMessage] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [promoted, setPromoted] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setReceipt(null);
    setPromoted(null);

    if (!vehicleNumber.trim()) {
      setMessage({ type: "error", text: "Please enter a vehicle number." });
      return;
    }

    setLoading(true);
    try {
      const data = await exitVehicle(vehicleNumber.trim());
      if (!data.success) {
        setMessage({ type: "error", text: data.message });
      } else {
        setMessage({ type: "success", text: data.message });
        setReceipt(data.receipt);
        setPromoted(data.promotedFromQueue);
        setVehicleNumber("");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar title="Exit Vehicle" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        <div className="card-form">
          {message && <div className={`${message.type}-msg`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. TS09AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Processing..." : "Exit Vehicle"}
            </button>
          </form>
        </div>

        {receipt && (
          <div className="receipt-box">
            <h3>🧾 Parking Receipt</h3>
            <div className="receipt-row">
              <span>Vehicle Number</span>
              <strong>{receipt.vehicleNumber}</strong>
            </div>
            <div className="receipt-row">
              <span>Slot Number</span>
              <strong>{receipt.slotNumber}</strong>
            </div>
            <div className="receipt-row">
              <span>Entry Time</span>
              <strong>{formatDateTime(receipt.entryTime)}</strong>
            </div>
            <div className="receipt-row">
              <span>Exit Time</span>
              <strong>{formatDateTime(receipt.exitTime)}</strong>
            </div>
            <div className="receipt-row">
              <span>Duration</span>
              <strong>{receipt.durationMinutes} minutes</strong>
            </div>
            <div className="receipt-row">
              <span>Hours Charged</span>
              <strong>{receipt.hoursCharged}</strong>
            </div>
            <div className="receipt-row">
              <span>Total Fee</span>
              <strong>₹{receipt.fee}</strong>
            </div>
          </div>
        )}

        {promoted && (
          <div className="info-msg" style={{ marginTop: 16 }}>
            Vehicle <strong>{promoted.vehicle_number}</strong> was next in the waiting queue and has been
            automatically assigned to slot <strong>{promoted.slot_number}</strong>.
          </div>
        )}
      </div>
    </div>
  );
}
