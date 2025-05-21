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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        objectSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
  })
);

// Prevent caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter); // Apply limiter to API only

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow only your frontend's URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
  credentials: true, // Allow cookies if needed
};

app.use(cors(corsOptions));

// Trust proxy
app.set("trust proxy", 1);

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







const bcrypt = require("bcrypt");

(async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE;

  if (!username || !password || !role) {
    console.error("⚠️ Admin credentials are missing.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
      [username, hashedPassword, role]
    );
    console.log("✅ Admin user created or already exists.");
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
})();





// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  //console.log(`✅ Server running on port ${PORT}`);
});
