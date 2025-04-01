const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// User Registration Route
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into the database
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
      [username, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (error) {
    console.error("Registration Error:", error); // Log the error in the terminal
    res.status(500).json({ error: error.message }); // Send the actual error message in response
  }
});

// User Login Route
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    try {
      // Check if user exists
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  
      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
  
      const user = result.rows[0];
  
      // Compare the entered password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
  
      // Generate JWT Token
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ message: "Login successful", token });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;
