const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { Pool } = require("pg");

// Cloudinary configuration
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure uploads directory exists (for any disk storage needs)
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const allowedMimes = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/mpeg", "video/quicktime",
  "application/pdf"
];

// Multer setup
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};
const uploadMemory = multer({ storage: multer.memoryStorage(), fileFilter });

/* ─── Create Project ───────────────────── */
router.post("/", async (req, res) => {
  const { title, description, status, constituency, image_urls, video_urls, reports } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (title, description, status, constituency, image_urls, video_urls, reports)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)
       RETURNING *`,
      [
        title?.trim() || "",
        description?.trim() || "",
        status,
        constituency?.trim() || "Unknown",
        JSON.stringify(image_urls || []),
        JSON.stringify(video_urls || []),
        JSON.stringify(reports || [])
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Get All Projects ─────────────────── */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    const projects = result.rows.map(project => ({
      ...project,
      media: [...(project.image_urls || []), ...(project.video_urls || [])]
    }));
    res.json(projects);
  } catch (error) {
    console.error("Fetch all projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Get Project by ID ─────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });
    const project = result.rows[0];
    project.media = [...(project.image_urls || []), ...(project.video_urls || [])];
    res.json(project);
  } catch (error) {
    console.error("Fetch project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Upload Image or Video ─────────────── */
router.post("/:id/media", uploadMemory.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
    const folder = mediaType === "image" ? "project_media" : "project_videos";

    cloudinary.uploader.upload_stream({ folder }, async (err, result) => {
      if (err || !result) return res.status(500).json({ error: "Upload failed" });

      const newMedia = {
        url: result.secure_url,
        type: mediaType,
        comment: "",
        public_id: result.public_id
      };
      const column = mediaType === "image" ? "image_urls" : "video_urls";

      await pool.query(
        `UPDATE projects
         SET ${column} = COALESCE(${column}, '[]'::jsonb) || $1::jsonb
         WHERE id = $2`,
        [JSON.stringify([newMedia]), req.params.id]
      );
      res.json(newMedia);
    }).end(req.file.buffer);
  } catch (error) {
    console.error("Upload media error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Upload Report ─────────────────────── */
router.post("/:id/reports", uploadMemory.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    cloudinary.uploader.upload_stream(
      { folder: "project_reports", resource_type: "raw" },
      async (err, result) => {
        if (err || !result) return res.status(500).json({ error: "Upload failed" });

        const newReport = {
          id: Date.now(),
          url: result.secure_url,
          public_id: result.public_id
        };

        await pool.query(
          `UPDATE projects
           SET reports = COALESCE(reports, '[]'::jsonb) || $1::jsonb
           WHERE id = $2`,
          [JSON.stringify([newReport]), req.params.id]
        );
        res.json(newReport);
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error("Upload report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Delete Report ─────────────────────── */
router.delete("/:id/reports/:reportId", async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const result = await pool.query("SELECT reports FROM projects WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const updatedReports = (result.rows[0].reports || []).filter(r => r.id !== parseInt(reportId));
    await pool.query("UPDATE projects SET reports = $1 WHERE id = $2", [JSON.stringify(updatedReports), id]);
    res.json({ success: true, message: "Report deleted" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─── Update Project ────────────────────── */
router.put("/:id", async (req, res) => {
  const { title, description, status, reports, media } = req.body;
  try {
    if (media) {
      const images = media.filter(m => m.type === "image");
      const videos = media.filter(m => m.type === "video");

      await pool.query(
        `UPDATE projects
         SET title = $1, description = $2, status = $3, reports = $4,
             image_urls = $5, video_urls = $6
         WHERE id = $7`,
        [title, description, status, reports, JSON.stringify(images), JSON.stringify(videos), req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE projects
         SET title = $1, description = $2, status = $3, reports = $4
         WHERE id = $5`,
        [title, description, status, reports, req.params.id]
      );
    }
    res.json({ success: true, message: "Project updated" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
