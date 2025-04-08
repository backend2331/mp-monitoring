const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Accepted MIME types
const allowedMimes = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/mpeg", "video/quicktime",
  "application/pdf", // for reports
];

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

const upload = multer({ storage, fileFilter });

// ─── Create Project ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { title, description, status, reports, created_by, constituency } = req.body;
  try {
    const trimmedTitle = title?.trim() || "";
    const trimmedDesc = description?.trim() || "";

    const result = await pool.query(
      `INSERT INTO projects (title, description, status, reports, created_by, constituency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [trimmedTitle, trimmedDesc, status, reports, created_by, constituency]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET All Projects ──────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    const projects = result.rows.map(project => {
      const images = project.image_urls || [];
      const videos = project.video_urls || [];
      return { ...project, media: [...images, ...videos] };
    });
    res.json(projects);
  } catch (error) {
    console.error("Fetch all projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET Single Project by ID ──────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const project = result.rows[0];
    project.media = [...(project.image_urls || []), ...(project.video_urls || [])];
    project.reports = project.reports || [];
    res.json(project);
  } catch (error) {
    console.error("Fetch project by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Upload Media (Image/Video) ────────────────────────────────────────
router.post("/:id/media", upload.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
    const newMedia = { url: fileUrl, type: mediaType, comment: "" };
    const column = mediaType === "image" ? "image_urls" : "video_urls";

    await pool.query(
      `UPDATE projects
       SET ${column} = COALESCE(${column}, '[]'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify([newMedia]), req.params.id]
    );
    res.json(newMedia);
  } catch (error) {
    console.error("Upload media error:", error);
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// ─── Upload Report ─────────────────────────────────────────────────────
router.post("/:id/reports", upload.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const reportUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const newReport = { id: Date.now(), url: reportUrl };

    await pool.query(
      `UPDATE projects
       SET reports = COALESCE(reports, '[]'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify([newReport]), req.params.id]
    );
    res.json(newReport);
  } catch (error) {
    console.error("Upload report error:", error);
    res.status(500).json({ error: "Failed to upload report" });
  }
});

// ─── Delete Specific Report ─────────────────────────────────────────────
router.delete("/:id/reports/:reportId", async (req, res) => {
  try {
    const projectId = req.params.id;
    const reportId = parseInt(req.params.reportId, 10);

    const result = await pool.query("SELECT reports FROM projects WHERE id = $1", [projectId]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const reports = result.rows[0].reports || [];
    const updated = reports.filter((r) => r.id !== reportId);

    await pool.query("UPDATE projects SET reports = $1 WHERE id = $2", [JSON.stringify(updated), projectId]);
    res.json({ success: true, message: "Report deleted" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// ─── Update Project ────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  const { title, description, reports, status, media } = req.body;
  try {
    if (media) {
      const images = media.filter((m) => m.type === "image");
      const videos = media.filter((m) => m.type === "video");

      await pool.query(
        `UPDATE projects
         SET title=$1, description=$2, reports=$3, status=$4,
             image_urls=$5, video_urls=$6
         WHERE id=$7`,
        [title, description, reports, status, JSON.stringify(images), JSON.stringify(videos), req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE projects
         SET title=$1, description=$2, reports=$3, status=$4
         WHERE id=$5`,
        [title, description, reports, status, req.params.id]
      );
    }

    res.json({ success: true, message: "Project updated successfully" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ─── Delete Project ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM projects WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Project not found" });

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

module.exports = router;
