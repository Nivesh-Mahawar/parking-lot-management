import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getStatus, addSlot, removeSlot } from "../api/api";

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const loadSlots = useCallback(async () => {
    try {
      const data = await getStatus();
      setSlots(data.slots);
    } catch (err) {
      setMessage({ type: "error", text: "Could not load slots." });
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  async function handleAddSlot() {
    setMessage(null);
    setBusy(true);
    try {
      const data = await addSlot();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        loadSlots();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error while adding slot." });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSlot(slotNumber) {
    setMessage(null);
    setBusy(true);
    try {
      const data = await removeSlot(slotNumber);
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        loadSlots();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Server error while removing slot." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Navbar title="Manage Slots" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        {message && <div className={`${message.type}-msg`}>{message.text}</div>}

        <button className="primary-btn" style={{ width: "auto", padding: "10px 20px" }} onClick={handleAddSlot} disabled={busy}>
          + Add New Slot
        </button>

        <div className="slot-grid" style={{ marginTop: 24 }}>
          {slots.map((slot) => (
            <div key={slot.id} className={`slot-box ${slot.status}`} style={{ position: "relative" }}>
              #{slot.slot_number}
              <span className="slot-label">{slot.status}</span>
              <button
                onClick={() => handleRemoveSlot(slot.slot_number)}
                disabled={busy || slot.status === "occupied"}
                title={slot.status === "occupied" ? "Can't remove an occupied slot" : "Remove this slot"}
                style={{
                  marginTop: 6,
                  width: "100%",
                  fontSize: 11,
                  padding: "3px 0",
                  border: "none",
                  borderRadius: 6,
                  background: slot.status === "occupied" ? "#9ca3af" : "#111827",
                  color: "#fff",
                  cursor: slot.status === "occupied" ? "not-allowed" : "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
