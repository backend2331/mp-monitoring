const jwt = require("jsonwebtoken");
const redis = require("redis");
require("dotenv").config(); // Load environment variables

// Configure Redis client to use the REDIS_URL
const client = redis.createClient({
  url: process.env.REDIS_URL, // Use the Redis URL from the environment
});

// Connect to Redis
client.connect().catch((err) => {
  console.error("Redis connection error:", err);
});

module.exports = async function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Check if the token is blacklisted
    const isBlacklisted = await client.get(token);
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token is blacklisted. Please log in again." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(400).json({ message: "Invalid token" });
  }
};
