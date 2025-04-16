require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Make the pool available throughout the app if needed
app.set("db", pool);

// Serve uploaded files (e.g. images, videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

// API Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const projectRoutes = require("./routes/projects");
app.use("/api/projects", projectRoutes);

// Test route
app.get("/api", (req, res) => {
  res.send("✅ MP Monitoring API is running...");
});

// Catch-all route to serve React's index.html for non-API routes
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/build", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("❌ Error serving React app:", err);
      res.status(500).send("Error loading the React app.");
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
