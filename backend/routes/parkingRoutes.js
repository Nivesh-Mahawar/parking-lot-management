const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getStatus,
  getQueue,
  searchVehicle,
  parkVehicle,
  exitVehicle,
  addSlot,
  removeSlot,
} = require("../controllers/parkingController");

router.get("/dashboard", getDashboard);
router.get("/status", getStatus);
router.get("/queue", getQueue);
router.get("/search/:vehicleNumber", searchVehicle);
router.post("/park", parkVehicle);
router.post("/exit", exitVehicle);
router.post("/slots", addSlot);
router.delete("/slots/:slotNumber", removeSlot);

module.exports = router;
