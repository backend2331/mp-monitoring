// routes/auth.js
const express = require("express");
const redis = require("redis");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const authMiddleware = require("../middleware/auth"); // Your existing auth middleware
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = redis.createClient(); // Create Redis client
client.connect(); // Connect to Redis

// 🔐 User Registration (Admin-only)
// This endpoint assumes that only an admin can register new users.
router.post("/register", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can register new users" });
  }

  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [username, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔑 Login Route
// Expects { username, password } in the request body
// Returns a JWT token along with user details if successful.
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Logout Route
router.post("/logout", async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    // Blacklist the token in Redis with an expiration time (e.g., 1 hour)
    await client.setEx(token, 3600, "blacklisted"); // Expire after 1 hour (same as token lifespan)

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error blacklisting token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
