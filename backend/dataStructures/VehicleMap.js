// dataStructures/VehicleMap.js
//
// DATA STRUCTURE: HashMap (JavaScript Map)
// ------------------------------------------
// Keyed by vehicle_number so we can look up / insert / remove a currently
// parked vehicle in O(1) average time, instead of scanning a list.

class VehicleMap {
  constructor() {
    /** @type {Map<string, object>} vehicle_number -> vehicle record */
    this.map = new Map();
  }

  // Bulk-load from DB at startup
  load(vehiclesArray) {
    this.map.clear();
    vehiclesArray.forEach((v) => this.map.set(v.vehicle_number, v));
  }

  has(vehicleNumber) {
    return this.map.has(vehicleNumber);
  }

  get(vehicleNumber) {
    return this.map.get(vehicleNumber) || null;
  }

  set(vehicleNumber, vehicleData) {
    this.map.set(vehicleNumber, vehicleData);
  }

  delete(vehicleNumber) {
    return this.map.delete(vehicleNumber);
  }

  getAll() {
    return Array.from(this.map.values());
  }

  size() {
    return this.map.size;
  }
}

module.exports = new VehicleMap();
