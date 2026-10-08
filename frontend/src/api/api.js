// src/api/api.js
// Small helper wrapping fetch() calls to the backend REST API.

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data.success === undefined) {
    // Network-level or unexpected error shape
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const login = (username, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });

export const getDashboard = () => request("/dashboard");

export const getStatus = () => request("/status");

export const getQueue = () => request("/queue");

export const searchVehicle = (vehicleNumber) => request(`/search/${encodeURIComponent(vehicleNumber)}`);

export const parkVehicle = (payload) =>
  request("/park", { method: "POST", body: JSON.stringify(payload) });

export const exitVehicle = (vehicleNumber) =>
  request("/exit", { method: "POST", body: JSON.stringify({ vehicleNumber }) });

// ---------- Auth: sign-up ----------
export const register = (username, email, password) =>
  request("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });

// ---------- Booking system ----------
export const getAvailableSlots = (start, end) =>
  request(`/bookings/available-slots?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);

export const createBooking = (payload) =>
  request("/bookings", { method: "POST", body: JSON.stringify(payload) });

export const getMyBookings = (userId) => request(`/bookings/mine?userId=${userId}`);

export const cancelBooking = (bookingId, userId) =>
  request(`/bookings/${bookingId}/cancel`, { method: "POST", body: JSON.stringify({ userId }) });

// ---------- Admin: view every booking in the system ----------
export const getAllBookings = () => request("/bookings");

// ---------- Admin: dynamic slot management ----------
export const addSlot = () => request("/slots", { method: "POST" });

export const removeSlot = (slotNumber) => request(`/slots/${slotNumber}`, { method: "DELETE" });
