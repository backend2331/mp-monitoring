const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from the .env file

// Use the DATABASE_URL from .env file to create the database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME; // Use the admin username from .env
  const password = process.env.ADMIN_PASSWORD; // Use the admin password from .env
  const role = process.env.ADMIN_ROLE; // Use the admin role from .env

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
      [username, hashedPassword, role]
    );

    //console.log("✅ Admin user created:", result.rows[0]);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
