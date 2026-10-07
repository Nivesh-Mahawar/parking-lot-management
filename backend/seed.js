// seed.js
// Run once with `npm run seed` to:
//   1. Create all tables (if they don't exist) by executing schema.sql
//   2. Insert a default admin user (username: admin, password: admin123)
//
// Safe to re-run - uses CREATE TABLE IF NOT EXISTS / INSERT IGNORE.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
    ssl:
      process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
        : undefined,
  });

  console.log("Connected to TiDB. Running schema.sql ...");

  const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await connection.query(schemaSql);

  console.log("Schema created / verified.");

  // Switch to the target database explicitly (schema.sql already creates it)
  await connection.query(`USE ${process.env.DB_NAME || "parking_lot_db"}`);

  // Create default admin user if none exists
  const [rows] = await connection.query(
    "SELECT * FROM users WHERE username = ?",
    ["admin"]
  );

  if (rows.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await connection.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')",
      ["admin", hashedPassword]
    );
    console.log("Default admin user created -> username: admin | password: admin123");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  await connection.end();
  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
