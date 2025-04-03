const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// GET all projects - returns media as a combined array of images and videos
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC"); // Order by ID to ensure consistent order
    const projects = result.rows.map((project) => {
      const images = project.image_urls || [];
      const videos = project.video_urls || [];
      return {
        ...project,
        media: [...images, ...videos],
      };
    });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single project by id - returns media as a combined array
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    const project = result.rows[0];
    const images = project.image_urls || [];
    const videos = project.video_urls || [];
    project.media = [...images, ...videos];
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST media upload endpoint for a project
router.post("/:id/media", upload.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith("image/")
      ? "image"
      : req.file.mimetype.startsWith("video/")
      ? "video"
      : "unknown";

    const newMedia = { url: fileUrl, type: mediaType, comment: "" };

    // Update the corresponding JSONB column in PostgreSQL. Use COALESCE to ensure a JSON array.
    if (mediaType === "image") {
      await pool.query(
        "UPDATE projects SET image_urls = COALESCE(image_urls, '[]'::jsonb) || $1::jsonb WHERE id = $2",
        [JSON.stringify([newMedia]), req.params.id]
      );
    } else if (mediaType === "video") {
      await pool.query(
        "UPDATE projects SET video_urls = COALESCE(video_urls, '[]'::jsonb) || $1::jsonb WHERE id = $2",
        [JSON.stringify([newMedia]), req.params.id]
      );
    }

    res.status(200).json(newMedia);
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

module.exports = router;
