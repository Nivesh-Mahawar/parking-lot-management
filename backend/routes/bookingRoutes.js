const express = require("express");
const router = express.Router();
const {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingController");

router.get("/available-slots", getAvailableSlots);
router.get("/mine", getMyBookings);
router.get("/", getAllBookings);
router.post("/", createBooking);
router.post("/:id/cancel", cancelBooking);

module.exports = router;
