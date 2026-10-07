// controllers/parkingController.js
//
// This file contains all the core parking logic. It uses the three
// in-memory data structures (SlotList, VehicleMap, WaitingQueue) for fast
// runtime operations, and persists every meaningful change to TiDB so state
// survives a server restart.

const pool = require("../config/db");
const slotList = require("../dataStructures/SlotList");
const vehicleMap = require("../dataStructures/VehicleMap");
const waitingQueue = require("../dataStructures/WaitingQueue");

const FEE_PER_HOUR = Number(process.env.FEE_PER_HOUR || 20);

// ---------------------------------------------------------------------------
// Called once when the server starts. Loads slots, currently-parked vehicles,
// and the waiting queue from TiDB into the in-memory data structures.
// ---------------------------------------------------------------------------
async function loadStateFromDB() {
  const [slots] = await pool.query("SELECT * FROM slots ORDER BY slot_number ASC");
  slotList.load(slots);

  const [vehicles] = await pool.query("SELECT * FROM vehicles WHERE status = 'parked'");
  vehicleMap.load(vehicles);

  const [queueRows] = await pool.query("SELECT * FROM waiting_queue ORDER BY added_time ASC");
  waitingQueue.load(queueRows);

  console.log(
    `State loaded: ${slotList.total()} slots, ${vehicleMap.size()} parked vehicles, ${waitingQueue.size()} waiting.`
  );
}

// ---------------------------------------------------------------------------
// GET /api/dashboard
// ---------------------------------------------------------------------------
function getDashboard(req, res) {
  res.json({
    totalSlots: slotList.total(),
    availableSlots: slotList.countAvailable(),
    occupiedSlots: slotList.countOccupied(),
    waitingCount: waitingQueue.size(),
    parkedVehicles: vehicleMap.getAll(),
  });
}

// ---------------------------------------------------------------------------
// GET /api/status  -> full slot-by-slot breakdown (the Array/List in action)
// ---------------------------------------------------------------------------
function getStatus(req, res) {
  res.json({ slots: slotList.getAll() });
}

// ---------------------------------------------------------------------------
// GET /api/queue -> current waiting line (the Queue in action)
// ---------------------------------------------------------------------------
function getQueue(req, res) {
  res.json({ queue: waitingQueue.getAll() });
}

// ---------------------------------------------------------------------------
// GET /api/search/:vehicleNumber -> the HashMap in action (O(1) lookup)
// ---------------------------------------------------------------------------
function searchVehicle(req, res) {
  const vehicleNumber = req.params.vehicleNumber.toUpperCase();

  const parked = vehicleMap.get(vehicleNumber);
  if (parked) {
    return res.json({ found: true, status: "parked", vehicle: parked });
  }

  const queuePosition = waitingQueue.positionOf(vehicleNumber);
  if (queuePosition !== -1) {
    return res.json({
      found: true,
      status: "waiting",
      queuePosition,
      vehicle: waitingQueue.getAll().find((v) => v.vehicle_number === vehicleNumber),
    });
  }

  return res.json({ found: false, message: "Vehicle not found in parking lot or waiting queue." });
}

// ---------------------------------------------------------------------------
// POST /api/park
// Body: { vehicleNumber, vehicleType, ownerName?, ownerContact? }
// ---------------------------------------------------------------------------
async function parkVehicle(req, res) {
  try {
    let { vehicleNumber, vehicleType, ownerName, ownerContact } = req.body;

    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ success: false, message: "Vehicle number and type are required." });
    }
    vehicleNumber = vehicleNumber.toUpperCase().trim();

    // 1. Already parked?
    if (vehicleMap.has(vehicleNumber)) {
      return res.status(409).json({ success: false, message: "This vehicle is already parked." });
    }

    // Already waiting?
    if (waitingQueue.positionOf(vehicleNumber) !== -1) {
      return res.status(409).json({
        success: false,
        message: `This vehicle is already in the waiting queue at position ${waitingQueue.positionOf(vehicleNumber)}.`,
      });
    }

    // 2. Check the slot list for a free slot
    const freeSlot = slotList.findFirstAvailable();

    if (freeSlot) {
      // 3. Slot available -> assign it
      const entryTime = new Date();

      slotList.markOccupied(freeSlot.slot_number);

      const [result] = await pool.query(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, owner_name, owner_contact, slot_number, entry_time, status)
         VALUES (?, ?, ?, ?, ?, ?, 'parked')`,
        [vehicleNumber, vehicleType, ownerName || null, ownerContact || null, freeSlot.slot_number, entryTime]
      );

      await pool.query("UPDATE slots SET status = 'occupied' WHERE slot_number = ?", [freeSlot.slot_number]);

      const vehicleRecord = {
        id: result.insertId,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        owner_name: ownerName || null,
        owner_contact: ownerContact || null,
        slot_number: freeSlot.slot_number,
        entry_time: entryTime,
        status: "parked",
      };
      vehicleMap.set(vehicleNumber, vehicleRecord);

      return res.json({
        success: true,
        parked: true,
        message: `Vehicle parked successfully in slot ${freeSlot.slot_number}.`,
        vehicle: vehicleRecord,
      });
    }

    // 4. No slot available -> add to waiting queue
    const addedTime = new Date();
    await pool.query(
      `INSERT INTO waiting_queue (vehicle_number, vehicle_type, owner_name, owner_contact, added_time)
       VALUES (?, ?, ?, ?, ?)`,
      [vehicleNumber, vehicleType, ownerName || null, ownerContact || null, addedTime]
    );

    const queueEntry = {
      vehicle_number: vehicleNumber,
      vehicle_type: vehicleType,
      owner_name: ownerName || null,
      owner_contact: ownerContact || null,
      added_time: addedTime,
    };
    waitingQueue.enqueue(queueEntry);

    return res.json({
      success: true,
      parked: false,
      message: "Parking lot is full. Vehicle added to the waiting queue.",
      queuePosition: waitingQueue.size(),
    });
  } catch (err) {
    console.error("Park vehicle error:", err);
    return res.status(500).json({ success: false, message: "Server error while parking vehicle." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/exit
// Body: { vehicleNumber }
// ---------------------------------------------------------------------------
async function exitVehicle(req, res) {
  try {
    let { vehicleNumber } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: "Vehicle number is required." });
    }
    vehicleNumber = vehicleNumber.toUpperCase().trim();

    // 1. Find the vehicle using the HashMap
    const vehicle = vehicleMap.get(vehicleNumber);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found in the parking lot." });
    }

    // 2. Retrieve its slot, 3. calculate duration, 4. calculate fee
    const exitTime = new Date();
    const entryTime = new Date(vehicle.entry_time);
    const durationMs = exitTime - entryTime;
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
    const hoursCharged = Math.ceil(durationMinutes / 60); // partial hour rounds up
    const fee = hoursCharged * FEE_PER_HOUR;

    const slotNumber = vehicle.slot_number;

    // Persist: mark vehicle as exited, log a parking_record, free the slot
    await pool.query("UPDATE vehicles SET status = 'exited' WHERE vehicle_number = ?", [vehicleNumber]);

    await pool.query(
      `INSERT INTO parking_records (vehicle_number, vehicle_type, slot_number, entry_time, exit_time, duration_minutes, fee)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vehicleNumber, vehicle.vehicle_type, slotNumber, entryTime, exitTime, durationMinutes, fee]
    );

    // Remove from the in-memory HashMap
    vehicleMap.delete(vehicleNumber);

    // Free the slot (in-memory + DB) by default...
    slotList.markAvailable(slotNumber);
    await pool.query("UPDATE slots SET status = 'available' WHERE slot_number = ?", [slotNumber]);

    let promoted = null;

    // ...unless someone is waiting: dequeue the front of the line (FIFO) and
    // immediately assign them to the slot that just freed up.
    if (!waitingQueue.isEmpty()) {
      const nextInLine = waitingQueue.dequeue();
      await pool.query("DELETE FROM waiting_queue WHERE vehicle_number = ?", [nextInLine.vehicle_number]);

      const newEntryTime = new Date();
      slotList.markOccupied(slotNumber);
      await pool.query("UPDATE slots SET status = 'occupied' WHERE slot_number = ?", [slotNumber]);

      const [result] = await pool.query(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, owner_name, owner_contact, slot_number, entry_time, status)
         VALUES (?, ?, ?, ?, ?, ?, 'parked')`,
        [
          nextInLine.vehicle_number,
          nextInLine.vehicle_type,
          nextInLine.owner_name,
          nextInLine.owner_contact,
          slotNumber,
          newEntryTime,
        ]
      );

      promoted = {
        id: result.insertId,
        vehicle_number: nextInLine.vehicle_number,
        vehicle_type: nextInLine.vehicle_type,
        owner_name: nextInLine.owner_name,
        owner_contact: nextInLine.owner_contact,
        slot_number: slotNumber,
        entry_time: newEntryTime,
        status: "parked",
      };
      vehicleMap.set(nextInLine.vehicle_number, promoted);
    }

    return res.json({
      success: true,
      message: "Vehicle exited successfully.",
      receipt: {
        vehicleNumber,
        slotNumber,
        entryTime,
        exitTime,
        durationMinutes,
        hoursCharged,
        fee,
      },
      promotedFromQueue: promoted, // null if nobody was waiting
    });
  } catch (err) {
    console.error("Exit vehicle error:", err);
    return res.status(500).json({ success: false, message: "Server error while processing exit." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/slots - admin adds a brand new parking slot to the lot
// ---------------------------------------------------------------------------
async function addSlot(req, res) {
  try {
    const [[row]] = await pool.query("SELECT COALESCE(MAX(slot_number), 0) AS maxSlot FROM slots");
    const newSlotNumber = row.maxSlot + 1;

    const [result] = await pool.query("INSERT INTO slots (slot_number, status) VALUES (?, 'available')", [
      newSlotNumber,
    ]);

    const newSlot = { id: result.insertId, slot_number: newSlotNumber, status: "available" };
    slotList.addSlot(newSlot);

    return res.json({ success: true, message: `Slot ${newSlotNumber} added.`, slot: newSlot });
  } catch (err) {
    console.error("Add slot error:", err);
    return res.status(500).json({ success: false, message: "Server error while adding slot." });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/slots/:slotNumber - admin removes a slot from the lot
// ---------------------------------------------------------------------------
async function removeSlot(req, res) {
  try {
    const { slotNumber } = req.params;
    const slot = slotList.findBySlotNumber(slotNumber);

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }
    if (slot.status === "occupied") {
      return res.status(409).json({
        success: false,
        message: `Slot ${slotNumber} currently has a vehicle parked in it and cannot be removed.`,
      });
    }

    // Guard against removing a slot that customers have booked (past or
    // upcoming) - keeps booking history from pointing at a slot that no
    // longer exists. Cancel or let those bookings resolve first.
    const [activeBookings] = await pool.query(
      "SELECT id FROM bookings WHERE slot_number = ? AND status = 'booked'",
      [slotNumber]
    );
    if (activeBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Slot ${slotNumber} has customer bookings against it and cannot be removed yet.`,
      });
    }

    await pool.query("DELETE FROM slots WHERE slot_number = ?", [slotNumber]);
    slotList.removeSlot(slotNumber);

    return res.json({ success: true, message: `Slot ${slotNumber} removed.` });
  } catch (err) {
    console.error("Remove slot error:", err);
    return res.status(500).json({ success: false, message: "Server error while removing slot." });
  }
}

module.exports = {
  loadStateFromDB,
  getDashboard,
  getStatus,
  getQueue,
  searchVehicle,
  parkVehicle,
  exitVehicle,
  addSlot,
  removeSlot,
};
