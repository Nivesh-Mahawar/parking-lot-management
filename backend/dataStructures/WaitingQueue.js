// dataStructures/WaitingQueue.js
//
// DATA STRUCTURE: Queue (FIFO)
// -------------------------------
// When the lot is full, new vehicles are enqueued. When a slot frees up,
// the vehicle at the FRONT of the queue (the one that has waited longest)
// is dequeued and assigned to the freed slot - classic FIFO behaviour.
//
// Implemented with a plain array using push() (enqueue) and shift() (dequeue).
// For a bigger production system you'd use a proper ring-buffer/linked-list
// queue to avoid shift()'s O(n) cost, but for a small parking lot this is
// simple, readable, and perfectly fine.

class WaitingQueue {
  constructor() {
    this.queue = [];
  }

  load(queueArray) {
    this.queue = queueArray;
  }

  // Add to the back of the line
  enqueue(vehicleData) {
    this.queue.push(vehicleData);
  }

  // Remove and return the vehicle at the front of the line
  dequeue() {
    return this.queue.shift() || null;
  }

  peek() {
    return this.queue[0] || null;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  size() {
    return this.queue.length;
  }

  getAll() {
    return this.queue;
  }

  // 1-based position of a vehicle in line (used to tell the user "you are #3")
  positionOf(vehicleNumber) {
    const idx = this.queue.findIndex((v) => v.vehicle_number === vehicleNumber);
    return idx === -1 ? -1 : idx + 1;
  }

  removeByVehicleNumber(vehicleNumber) {
    const idx = this.queue.findIndex((v) => v.vehicle_number === vehicleNumber);
    if (idx !== -1) {
      return this.queue.splice(idx, 1)[0];
    }
    return null;
  }
}

module.exports = new WaitingQueue();
