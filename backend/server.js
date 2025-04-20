require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow only your frontend's URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
  credentials: true, // Allow cookies if needed
};

app.use(cors(corsOptions));

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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  //console.log(`✅ Server running on port ${PORT}`);
});
