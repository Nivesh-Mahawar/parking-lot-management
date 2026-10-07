// controllers/authController.js
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    // Simple session response (no JWT needed for this beginner-friendly app).
    // In production you'd issue a signed token here instead.
    return res.json({
      success: true,
      message: "Login successful.",
      user: { id: user.id, username: user.username, role: user.role || "customer" },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
}

// POST /api/auth/register
// Customer sign-up. Admin accounts are not created through this endpoint -
// only the seed script creates the admin account.
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)",
      [username, email || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Username or email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'customer')",
      [username, email || null, hashedPassword]
    );

    return res.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      user: { id: result.insertId, username, role: "customer" },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
}

module.exports = { login, register };
