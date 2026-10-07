import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { getQueue } from "../api/api";

export default function WaitingQueue() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadQueue = useCallback(async () => {
    try {
      const data = await getQueue();
      setQueue(data.queue);
    } catch (err) {
      setError("Could not load waiting queue.");
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  return (
    <div>
      <Navbar title="Waiting Queue" />
      <div className="page-wrapper">
        <button className="back-link" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>

        {error && <div className="error-msg">{error}</div>}

        {queue.length === 0 ? (
          <div className="info-msg">No vehicles are currently waiting. 🎉</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Waiting Since</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((v, idx) => (
                <tr key={v.vehicle_number}>
                  <td>#{idx + 1}</td>
                  <td>{v.vehicle_number}</td>
                  <td>{v.vehicle_type}</td>
                  <td>{v.owner_name || "-"}</td>
                  <td>{new Date(v.added_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
