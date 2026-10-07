// controllers/bookingController.js
//
// Handles advance reservations: a customer picks a start/end time, sees a
// theater-seat-style grid of all parking slots, and reserves one that's free
// for that whole window. Availability is computed by checking for any
// existing (non-cancelled) booking on that slot whose time range overlaps
// the requested window.

const pool = require("../config/db");
const slotList = require("../dataStructures/SlotList");

function validateTimeRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid start or end time.";
  }
  if (end <= start) {
    return "End time must be after start time.";
  }
  if (start < new Date(Date.now() - 5 * 60 * 1000)) {
    return "Start time cannot be in the past.";
  }
  return null;
}

// Two time ranges [s1,e1) and [s2,e2) overlap if s1 < e2 AND s2 < e1
const OVERLAP_CONDITION = "start_time < ? AND end_time > ?";

// ---------------------------------------------------------------------------
// GET /api/bookings/available-slots?start=...&end=...
// Returns every CURRENTLY EXISTING slot (whatever the admin has added/removed)
// with an `available` flag for that window.
// ---------------------------------------------------------------------------
async function getAvailableSlots(req, res) {
  try {
    const { start, end } = req.query;
    const validationError = validateTimeRange(start, end);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const [bookedRows] = await pool.query(
      `SELECT DISTINCT slot_number FROM bookings
       WHERE status = 'booked' AND ${OVERLAP_CONDITION}`,
      [end, start]
    );
    const bookedSlotNumbers = new Set(bookedRows.map((r) => r.slot_number));

    // Use the live slot list (kept in sync as the admin adds/removes slots)
    // instead of a fixed count, so booking always matches the real lot size.
    const slots = slotList
      .getAll()
      .map((s) => ({ slot_number: s.slot_number, available: !bookedSlotNumbers.has(s.slot_number) }))
      .sort((a, b) => a.slot_number - b.slot_number);

    return res.json({ success: true, slots });
  } catch (err) {
    console.error("Get available slots error:", err);
    return res.status(500).json({ success: false, message: "Server error while checking availability." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/bookings
// Body: { userId, slotNumber, vehicleNumber, vehicleType, startTime, endTime }
// ---------------------------------------------------------------------------
async function createBooking(req, res) {
  try {
    const { userId, slotNumber, vehicleNumber, vehicleType, startTime, endTime } = req.body;

    if (!userId || !slotNumber || !vehicleNumber || !vehicleType || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (!slotList.findBySlotNumber(slotNumber)) {
      return res.status(400).json({ success: false, message: "That slot no longer exists." });
    }

    const validationError = validateTimeRange(startTime, endTime);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // Re-check for a conflicting booking right before inserting (avoids most race conditions)
    const [conflicts] = await pool.query(
      `SELECT id FROM bookings
       WHERE slot_number = ? AND status = 'booked' AND ${OVERLAP_CONDITION}`,
      [slotNumber, endTime, startTime]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Slot ${slotNumber} was just booked by someone else for that time. Please pick another slot.`,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO bookings (user_id, slot_number, vehicle_number, vehicle_type, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'booked')`,
      [userId, slotNumber, vehicleNumber.toUpperCase().trim(), vehicleType, startTime, endTime]
    );

    return res.json({
      success: true,
      message: `Slot ${slotNumber} booked successfully.`,
      booking: {
        id: result.insertId,
        slot_number: slotNumber,
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        vehicle_type: vehicleType,
        start_time: startTime,
        end_time: endTime,
        status: "booked",
      },
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ success: false, message: "Server error while creating booking." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/bookings/mine?userId=...
// ---------------------------------------------------------------------------
async function getMyBookings(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE user_id = ? ORDER BY start_time DESC",
      [userId]
    );

    return res.json({ success: true, bookings: rows });
  } catch (err) {
    console.error("Get my bookings error:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching bookings." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/bookings/:id/cancel
// Body: { userId }  -> used to confirm the requester owns this booking
// ---------------------------------------------------------------------------
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const booking = rows[0];
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, message: "You can only cancel your own bookings." });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled." });
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);

    return res.json({ success: true, message: "Booking cancelled." });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({ success: false, message: "Server error while cancelling booking." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/bookings  (admin: view every booking in the system)
// ---------------------------------------------------------------------------
async function getAllBookings(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT bookings.*, users.username FROM bookings
       JOIN users ON bookings.user_id = users.id
       ORDER BY start_time DESC`
    );
    return res.json({ success: true, bookings: rows });
  } catch (err) {
    console.error("Get all bookings error:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching bookings." });
  }
}

module.exports = {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
};
