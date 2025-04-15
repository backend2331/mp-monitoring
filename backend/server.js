require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test route
app.get("/", (req, res) => {
  res.send("MP Monitoring API is running...");
});

// Import Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes); // Mount the authRoutes at /api/auth

const projectRoutes = require("./routes/projects");
app.use("/api/projects", projectRoutes);

// Catch-all route to serve React's index.html (must be last)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/build", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error serving React app:", err);
      res.status(500).send("Error loading the React app.");
    }
  });
});

// Start the server with better error handling
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});