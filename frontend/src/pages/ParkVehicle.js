import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { parkVehicle } from "../api/api";

export default function ParkVehicle() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [message, setMessage] = useState(null); // {type: 'success'|'error'|'info', text}
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!vehicleNumber.trim() || !vehicleType.trim()) {
      setMessage({ type: "error", text: "Vehicle number and type are required." });
      return;
    }

    setLoading(true);
    try {
      const data = await parkVehicle({
        vehicleNumber: vehicleNumber.trim(),
        vehicleType,
        ownerName: ownerName.trim(),
        ownerContact: ownerContact.trim(),
      });

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
      } else if (data.parked) {
        setMessage({ type: "success", text: data.message });
        setVehicleNumber("");
        setOwnerName("");
        setOwnerContact("");
      } else {
        setMessage({
          type: "info",
          text: `${data.message} Queue position: #${data.queuePosition}.`,
        });
        setVehicleNumber("");
        setOwnerName("");
        setOwnerContact("");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar title="Park Vehicle" />
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

            <div className="form-group">
              <label>Owner Name (optional)</label>
              <input
                type="text"
                placeholder="John Doe"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Owner Contact (optional)</label>
              <input
                type="text"
                placeholder="9876543210"
                value={ownerContact}
                onChange={(e) => setOwnerContact(e.target.value)}
              />
            </div>

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? "Processing..." : "Park Vehicle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
