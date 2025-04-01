const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const auth = require("../middleware/auth"); // Import authentication middleware

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a new project (Only MPs & Monitoring Teams can do this)
router.post("/create", auth, async (req, res) => {
  const { title, description, image_url, video_url, report_url } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO projects (title, description, image_url, video_url, report_url, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description, image_url, video_url, report_url, req.user.id]
    );

    res.status(201).json({ message: "Project created successfully", project: result.rows[0] });
  } catch (error) {
    console.error("Project Creation Error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Update project (Only MPs & Monitoring Teams can do this)
router.put("/update/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { title, description, image_url, video_url, report_url } = req.body;
  
    // Check if project exists
    const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
  
    try {
      const result = await pool.query(
        "UPDATE projects SET title = $1, description = $2, image_url = $3, video_url = $4, report_url = $5 WHERE id = $6 RETURNING *",
        [title, description, image_url, video_url, report_url, id]
      );
  
      res.json({ message: "Project updated successfully", project: result.rows[0] });
    } catch (error) {
      console.error("Project Update Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
 
  
  // Delete project (Only MPs can delete projects)
router.delete("/delete/:id", auth, async (req, res) => {
    const { id } = req.params;
  
    // Ensure only MPs can delete projects
    if (req.user.role !== "mp") {
      return res.status(403).json({ message: "Access denied. Only MPs can delete projects." });
    }
  
    try {
      const result = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING *", [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }
  
      res.json({ message: "Project deleted successfully", project: result.rows[0] });
    } catch (error) {
      console.error("Project Deletion Error:", error);
      res.status(500).json({ error: error.message });
    }
  });


 // Get all projects (Public Access - No Authentication Required)
 router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
});


 // Get a specific project by ID (Public Access)
 router.get("/:id", async (req, res) => {
  const { id } = req.params;  // Get project ID from request

  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(result.rows[0]);  // Return project details
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: error.message });
  }
});  


module.exports = router;
