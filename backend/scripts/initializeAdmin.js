const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE;

  if (!username || !password || !role) {
    console.error("Admin credentials are missing in the environment variables.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
      [username, hashedPassword, role]
    );
    console.log("Admin user initialized successfully.");
  } catch (error) {
    console.error("Error initializing admin user:", error);
  } finally {
    pool.end();
  }
})();