// config/db.js
// Sets up a MySQL2 connection pool pointed at TiDB.
// TiDB speaks the MySQL wire protocol, so the standard mysql2 driver works as-is.

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "parking_lot_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DATETIME/TIMESTAMP columns as plain "YYYY-MM-DD HH:MM:SS" strings
  // instead of auto-converted JS Date objects. This avoids a double timezone
  // shift: we store exactly the wall-clock time the user picked, and we want
  // to read back exactly that same wall-clock time, with no UTC conversion
  // happening on the way in or out.
  dateStrings: true,
  // TiDB Cloud requires a TLS connection. Set DB_SSL=true in .env when
  // connecting to TiDB Cloud; leave it unset/false for local MySQL/TiDB.
  ssl:
    process.env.DB_SSL === "true"
      ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
      : undefined,
});

module.exports = pool;
