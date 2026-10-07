import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ParkVehicle from "./pages/ParkVehicle";
import ExitVehicle from "./pages/ExitVehicle";
import ParkingStatus from "./pages/ParkingStatus";
import SearchVehicle from "./pages/SearchVehicle";
import WaitingQueue from "./pages/WaitingQueue";
import AdminBookings from "./pages/AdminBookings";
import ManageSlots from "./pages/ManageSlots";
import CustomerDashboard from "./pages/CustomerDashboard";
import BookSlot from "./pages/BookSlot";
import MyBookings from "./pages/MyBookings";

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function getRole() {
  return localStorage.getItem("role") || "customer";
}

// Auth guard - redirects to /login if no session found
function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

// Admin-only guard - customers get bounced to their own dashboard
function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return getRole() === "admin" ? children : <Navigate to="/customer" replace />;
}

function homeRedirect() {
  if (!isLoggedIn()) return "/login";
  return getRole() === "admin" ? "/dashboard" : "/customer";
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin (walk-in management) routes */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/park"
          element={
            <AdminRoute>
              <ParkVehicle />
            </AdminRoute>
          }
        />
        <Route
          path="/exit"
          element={
            <AdminRoute>
              <ExitVehicle />
            </AdminRoute>
          }
        />
        <Route
          path="/status"
          element={
            <AdminRoute>
              <ParkingStatus />
            </AdminRoute>
          }
        />
        <Route
          path="/search"
          element={
            <AdminRoute>
              <SearchVehicle />
            </AdminRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <AdminRoute>
              <WaitingQueue />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-bookings"
          element={
            <AdminRoute>
              <AdminBookings />
            </AdminRoute>
          }
        />
        <Route
          path="/manage-slots"
          element={
            <AdminRoute>
              <ManageSlots />
            </AdminRoute>
          }
        />

        {/* Customer (advance booking) routes */}
        <Route
          path="/customer"
          element={
            <PrivateRoute>
              <CustomerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/book"
          element={
            <PrivateRoute>
              <BookSlot />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to={homeRedirect()} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
