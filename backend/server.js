// server.js - entry point for the Parking Lot Management backend
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const { loadStateFromDB } = require("./controllers/parkingController");

const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger - handy while developing
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", parkingRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("Parking Lot Management API is running.");
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await loadStateFromDB(); // populate SlotList / VehicleMap / WaitingQueue from TiDB
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server. Did you run `npm run seed` and set up your .env?", err);
    process.exit(1);
  }
}

start();
