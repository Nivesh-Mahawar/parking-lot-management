# 🅿️ Parking Lot Management System

A full-stack parking lot management app.

- **Frontend:** React.js
- **Backend:** Node.js + Express.js
- **Database:** TiDB (MySQL-compatible)

Demonstrates three core data structures in real, working code:
| Data Structure | Where | Purpose |
|---|---|---|
| **Array/List** | `backend/dataStructures/SlotList.js` | Stores and scans all parking slots |
| **HashMap (Map)** | `backend/dataStructures/VehicleMap.js` | O(1) lookup of currently parked vehicles by number |
| **Queue (FIFO)** | `backend/dataStructures/WaitingQueue.js` | Vehicles waiting when the lot is full, served in order |

---

## 1. Prerequisites

- Node.js (v18+) installed
- A running TiDB instance. Easiest options:
  - **TiDB Cloud** (free serverless tier) — https://tidbcloud.com
  - **Local TiDB Playground**: `tiup playground` (requires TiUP: https://docs.pingcap.com/tidb/stable/tiup-overview)
  - Since TiDB speaks the MySQL protocol, a local MySQL 8 instance also works for development if you don't have TiDB set up.

---

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your TiDB connection details (host, port, user, password). TiDB Cloud connections typically require SSL — if so, add `DB_SSL=true`-style handling as needed for your provider's connection snippet, or use the connection string they provide.

Create the database tables and default admin user:

```bash
npm run seed
```

This prints a default login:
```
username: admin
password: admin123
```

Start the backend:

```bash
npm start
```

The API runs at `http://localhost:5000`.

---

## 3. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000` and talks to the backend at `http://localhost:5000/api` (see `src/api/api.js` if you need to change this).

---

## 4. Using the App

There are two account types sharing one login page — it detects your role after login and sends you to the right dashboard.

### Admin (walk-in management)
1. **Login** with `admin` / `admin123`.
2. **Dashboard** shows live counts (auto-refreshes every 5s) and links to every feature.
3. **Park Vehicle** — enter a vehicle number/type. If a slot is free it's assigned immediately; if the lot is full, the vehicle is placed in the waiting queue and shown its position.
4. **Exit Vehicle** — enter the vehicle number. The app calculates duration + fee, frees the slot, and (if anyone is waiting) automatically promotes the next vehicle in the queue into that slot.
5. **Parking Status** — visual grid of every slot (green = free, red = occupied).
6. **Search Vehicle** — instantly find a vehicle whether it's parked or waiting.
7. **Waiting Queue** — see everyone in line, in order.
8. **Customer Bookings** — see every advance reservation made by every customer account.
9. **Manage Slots** — add a new slot (auto-numbered) or remove an existing one. A slot can't be removed while a vehicle is parked in it or while it has customer bookings against it. The lot is no longer fixed at 10 — `TOTAL_SLOTS` in `.env` only sets the *starting* count when you first run `npm run seed`; after that, slot count is whatever you've added/removed via this screen.

### Customers (advance booking)
1. **Sign Up** from the login page's "Create an account" link — username, optional email, password.
2. **Log in** — customers land on their own dashboard with "Book a Slot" and "My Bookings".
3. **Book a Slot** — pick a start and end time, click "Check Availability", and a theater-seat-style grid of rectangular parking spaces appears (green = free for that window, red = taken, blue = your selection). Click a free spot, enter your vehicle number/type, and confirm.
4. **My Bookings** — see every booking you've made with its slot, time window, and status; cancel any upcoming booking.

> Note: bookings are advance reservations tracked separately from the admin's live walk-in system (both reference the same 10 physical slot numbers for consistency, but a slot's booking availability reflects only overlapping reservations for the chosen time window — not live walk-in occupancy). Combining the two into one fully unified view would be a good next step if you want to extend this further.

---

## 4a. Already seeded your database before? Run this migration once

If you ran `npm run seed` before this booking feature was added, your `users` table is
missing the new `role`/`email` columns and the `bookings` table doesn't exist yet.
Easiest fix — connect to your TiDB instance's SQL editor (in the TiDB Cloud console,
click your cluster → "Chat2Query" or "SQL Editor") and run:

```sql
USE parking_lot_db;

ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN role ENUM('admin', 'customer') DEFAULT 'customer';
UPDATE users SET role = 'admin' WHERE username = 'admin';

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_number INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('booked', 'cancelled', 'completed') DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Then just restart the backend (`npm start`) — no need to re-run `npm run seed`.

## 5. Project Structure

```
parking-lot-management/
├── backend/
│   ├── config/db.js               # TiDB connection pool
│   ├── controllers/
│   │   ├── authController.js      # login logic
│   │   └── parkingController.js   # park/exit/search/status/queue logic
│   ├── dataStructures/
│   │   ├── SlotList.js            # Array
│   │   ├── VehicleMap.js          # HashMap
│   │   └── WaitingQueue.js        # Queue
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── parkingRoutes.js
│   ├── schema.sql
│   ├── seed.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/index.html
    └── src/
        ├── api/api.js
        ├── pages/
        │   ├── Navbar.js
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── ParkVehicle.js
        │   ├── ExitVehicle.js
        │   ├── ParkingStatus.js
        │   ├── SearchVehicle.js
        │   └── WaitingQueue.js
        ├── App.js
        ├── App.css
        └── index.js
```

## 6. Notes on Fee Calculation

Fee = `ceil(minutes_parked / 60) * FEE_PER_HOUR` (partial hours round up to the next full hour). Change `FEE_PER_HOUR` in `backend/.env`.

## 7. Notes on Auth

For simplicity this project uses a lightweight "is logged in" flag stored in `localStorage` after a successful password check (bcrypt-hashed passwords in TiDB) rather than full JWT sessions. This keeps the code beginner-friendly; swap in JWTs or server sessions if you need real security for production use.
