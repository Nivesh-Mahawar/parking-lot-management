// dataStructures/SlotList.js
//
// DATA STRUCTURE: Array / List
// -----------------------------
// Holds every parking slot in a plain JavaScript array. This is the in-memory
// mirror of the `slots` table in TiDB, kept in sync on every park/exit.

class SlotList {
  constructor() {
    /** @type {Array<{id:number, slot_number:number, status:'available'|'occupied'}>} */
    this.slots = [];
  }

  // Replace the whole array (used once at server startup, loaded from DB)
  load(slotsArray) {
    this.slots = slotsArray;
  }

  getAll() {
    return this.slots;
  }

  // Linear scan for the first free slot -> classic array traversal
  findFirstAvailable() {
    return this.slots.find((s) => s.status === "available") || null;
  }

  findBySlotNumber(slotNumber) {
    return this.slots.find((s) => s.slot_number === Number(slotNumber)) || null;
  }

  markOccupied(slotNumber) {
    const slot = this.findBySlotNumber(slotNumber);
    if (slot) slot.status = "occupied";
    return slot;
  }

  markAvailable(slotNumber) {
    const slot = this.findBySlotNumber(slotNumber);
    if (slot) slot.status = "available";
    return slot;
  }

  countAvailable() {
    return this.slots.filter((s) => s.status === "available").length;
  }

  countOccupied() {
    return this.slots.filter((s) => s.status === "occupied").length;
  }

  total() {
    return this.slots.length;
  }

  // Admin added a brand new slot to the lot
  addSlot(slotObj) {
    this.slots.push(slotObj);
    this.slots.sort((a, b) => a.slot_number - b.slot_number);
  }

  // Admin removed a slot from the lot
  removeSlot(slotNumber) {
    this.slots = this.slots.filter((s) => s.slot_number !== Number(slotNumber));
  }
}

// Singleton instance shared across the whole app
module.exports = new SlotList();
