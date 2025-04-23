const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { Pool } = require("pg");
const axios = require("axios");
const authMiddleware = require("../middleware/auth");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/gif", "video/mp4", "video/avi"];
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and image files are allowed."));
  }
};
const uploadMemory = multer({ storage: multer.memoryStorage(), fileFilter });

// Apply authentication middleware
router.use(authMiddleware);

// Create a new project
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

// Fetch all projects (Public Access)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    const projects = result.rows.map((project) => ({
      ...project,
      media: [...(project.image_urls || []), ...(project.video_urls || [])],
    }));
    res.json(projects); // Publicly accessible
  } catch (error) {
    console.error("Fetch all projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch a single project
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

// Upload a new media file (image or video)
router.post("/:id/media", uploadMemory.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
    const folder = mediaType === "image" ? "project_media" : "project_videos";
    const sanitizedFileName = path.parse(req.file.originalname)
      .name.replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: sanitizedFileName,
        resource_type: mediaType === "image" ? "image" : "video",
      },
      async (err, result) => {
        if (err || !result) return res.status(500).json({ error: "Upload failed" });

        const newMedia = {
          url: result.secure_url,
          type: mediaType,
          comment: "",
          public_id: result.public_id,
        };
        const column = mediaType === "image" ? "image_urls" : "video_urls";

        await pool.query(
          `UPDATE projects
           SET ${column} = COALESCE(${column}, '[]'::jsonb) || $1::jsonb
           WHERE id = $2`,
          [JSON.stringify([newMedia]), req.params.id]
        );
        res.json(newMedia);
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error("Upload media error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a project (including new reports)
router.put("/:id", uploadMemory.array("newReports"), async (req, res) => {
  const { id } = req.params;
  const { title, description, status, media, reports } = req.body;

  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  let uploadedReports = [];
  try {
    // Check if files are uploaded
    if (req.files && req.files.length > 0) {
      uploadedReports = await Promise.all(
        req.files.map((file) => {
          if (file.mimetype !== "application/pdf") {
            throw new Error("Invalid file type. Only PDF files are allowed.");
          }
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "project_reports",
                resource_type: "raw", // Ensure this is set for PDFs
                format: "pdf",
                type: "upload",
                public_id: path.parse(file.originalname).name.replace(/\s+/g, "_"),
              },
              (err, result) => {
                if (err || !result) return reject(new Error("Failed to upload report to Cloudinary"));
                resolve({
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  fileName: file.originalname,
                  url: result.secure_url.replace("/upload/", "/upload/fl_attachment/"),
                  public_id: result.public_id,
                });
              }
            );
            uploadStream.end(file.buffer);
          });
        })
      );
    }

    // Fetch the existing project
    const existing = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Project not found" });

    const existingReports = existing.rows[0].reports || [];
    const finalReports = [...existingReports, ...uploadedReports];

    // Update the project in the database
    await pool.query(
      `UPDATE projects
       SET title = $1, description = $2, status = $3, image_urls = $4, video_urls = $5, reports = $6
       WHERE id = $7`,
      [
        title,
        description,
        status,
        JSON.stringify(media?.filter((m) => m.type === "image") || []),
        JSON.stringify(media?.filter((m) => m.type === "video") || []),
        JSON.stringify(finalReports),
        id,
      ]
    );

    res.json({ success: true, message: "Project updated", reports: finalReports });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a report
router.delete("/:id/reports/:reportId", async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const parsedReportId = parseInt(reportId, 10);
    if (!reportId || isNaN(parsedReportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }
    const result = await pool.query("SELECT reports FROM projects WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const reports = result.rows[0].reports || [];
    const reportToDelete = reports.find((r) => r.id === parsedReportId);
    if (!reportToDelete) return res.status(404).json({ error: "Report not found" });

    if (reportToDelete.public_id) {
      await cloudinary.uploader.destroy(reportToDelete.public_id, { resource_type: "raw" });
    }

    const updatedReports = reports.filter((r) => r.id !== parsedReportId);
    await pool.query("UPDATE projects SET reports = $1 WHERE id = $2", [
      JSON.stringify(updatedReports),
      id,
    ]);
    res.json({ success: true, message: "Report deleted" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- UPDATED Delete Media route (Fix #2) ----
router.delete("/:id/media", async (req, res) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;             // receive the Cloudinary public_id in the body

  

    // Fetch the project to get the media details
    const result = await pool.query(
      "SELECT image_urls, video_urls FROM projects WHERE id = $1",
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { image_urls = [], video_urls = [] } = result.rows[0];
    const allMedia = [...image_urls, ...video_urls];
    const mediaToDelete = allMedia.find((m) => m.public_id === public_id);

    if (!mediaToDelete) {
      return res.status(404).json({ error: "Media not found" });
    }

    // Delete from Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.destroy(
      mediaToDelete.public_id,
      {
        resource_type: mediaToDelete.type === "image" ? "image" : "video",
      }
    );
    if (
      cloudinaryResponse.result !== "ok" &&
      cloudinaryResponse.result !== "not found"
    ) {
      return res.status(500).json({ error: "Failed to delete media from Cloudinary" });
    }

    // Remove from DB
    const updatedImageUrls = image_urls.filter((m) => m.public_id !== public_id);
    const updatedVideoUrls = video_urls.filter((m) => m.public_id !== public_id);
    await pool.query(
      `UPDATE projects
       SET image_urls = $1, video_urls = $2
       WHERE id = $3`,
      [JSON.stringify(updatedImageUrls), JSON.stringify(updatedVideoUrls), id]
    );

    res.json({ success: true, message: "Media deleted" });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the project to get associated media and reports
    const result = await pool.query("SELECT image_urls, video_urls, reports FROM projects WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { image_urls = [], video_urls = [], reports = [] } = result.rows[0];

    // Delete media from Cloudinary
    const allMedia = [...image_urls, ...video_urls];
    for (const media of allMedia) {
      await cloudinary.uploader.destroy(media.public_id, {
        resource_type: media.type === "image" ? "image" : "video",
      });
    }

    // Delete reports from Cloudinary
    for (const report of reports) {
      if (report.public_id) {
        await cloudinary.uploader.destroy(report.public_id, { resource_type: "raw" });
      }
    }

    // Delete the project from the database
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);

    res.json({ success: true, message: "Project and associated resources deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Download a report
router.get("/:id/reports/:reportId/download", async (req, res) => {
  try {
    const { id, reportId } = req.params;

    // Fetch the project and reports
    const result = await pool.query("SELECT reports FROM projects WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const reports = result.rows[0].reports || [];
    const report = reports.find((r) => r.id === parseInt(reportId, 10));
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Fetch the file from Cloudinary
    const response = await axios.get(report.url, { responseType: "stream" });

    if (response.status !== 200) {
      return res.status(404).json({ error: "File not found on Cloudinary" });
    }

    // Set headers and pipe the file to the client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${report.fileName}"`);
    response.data.pipe(res);
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch MP-specific projects (Protected)
router.get("/mp-dashboard", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE mp_id = $1", [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch MP projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve static uploads
router.use("/uploads/reports", express.static(path.join(uploadsDir, "reports")));

module.exports = router;
