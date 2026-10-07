import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { searchVehicle } from "../api/api";

export default function SearchVehicle() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!vehicleNumber.trim()) {
      setError("Please enter a vehicle number to search.");
      return;
    }

    setLoading(true);
    try {
      const data = await searchVehicle(vehicleNumber.trim());
      setResult(data);
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar title="Search Vehicle" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        <div className="card-form">
          {error && <div className="error-msg">{error}</div>}

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
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {result && !result.found && <div className="info-msg" style={{ marginTop: 16 }}>{result.message}</div>}

        {result && result.found && result.status === "parked" && (
          <div className="receipt-box">
            <h3>✅ Vehicle Found - Currently Parked</h3>
            <div className="receipt-row">
              <span>Vehicle Number</span>
              <strong>{result.vehicle.vehicle_number}</strong>
            </div>
            <div className="receipt-row">
              <span>Type</span>
              <strong>{result.vehicle.vehicle_type}</strong>
            </div>
            <div className="receipt-row">
              <span>Slot Number</span>
              <strong>{result.vehicle.slot_number}</strong>
            </div>
            <div className="receipt-row">
              <span>Entry Time</span>
              <strong>{new Date(result.vehicle.entry_time).toLocaleString()}</strong>
            </div>
            {result.vehicle.owner_name && (
              <div className="receipt-row">
                <span>Owner</span>
                <strong>{result.vehicle.owner_name}</strong>
              </div>
            )}
          </div>
        )}

        {result && result.found && result.status === "waiting" && (
          <div className="receipt-box">
            <h3>⏳ Vehicle Found - In Waiting Queue</h3>
            <div className="receipt-row">
              <span>Vehicle Number</span>
              <strong>{result.vehicle.vehicle_number}</strong>
            </div>
            <div className="receipt-row">
              <span>Queue Position</span>
              <strong>#{result.queuePosition}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
