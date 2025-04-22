// src/components/ProjectDetails.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectDetails = ({ userRole }) => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [localProject, setLocalProject] = useState(null);
  const [localMedia, setLocalMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mediaComments, setMediaComments] = useState({});
  const [uploading, setUploading] = useState(false);
  const [reportUploading, setReportUploading] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true); // Start loading
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project details");
      const project = await response.json();
      setLocalProject(project);
      setLocalMedia(project.media || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError("Failed to load project details.");
    } finally {
      setLoading(false); // Stop loading
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleFieldChange = (field, value) => {
    setLocalProject({ ...localProject, [field]: value });
  };

  const handleCommentChange = (index, value) => {
    setMediaComments((prev) => ({ ...prev, [index]: value }));
  };

  const saveComment = (index) => {
    const updated = [...localMedia];
    updated[index].comment = mediaComments[index] || "";
    setLocalMedia(updated);
    setMediaComments((prev) => ({ ...prev, [index]: "" }));
  };

  const deleteComment = (index) => {
    const updated = [...localMedia];
    updated[index].comment = "";
    setLocalMedia(updated);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("media", file);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Media upload failed");
      const newMedia = await response.json();
      setLocalMedia((prev) => [...prev, newMedia]);
      alert("Media uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMedia = () => document.getElementById("mediaUploadInput").click();
  const handleStatusChange = (e) => handleFieldChange("status", e.target.value);

  const handleAddReport = async (file) => {
    setReportUploading(true);
    const formData = new FormData();
    formData.append("newReports", file);
    formData.append("title", localProject.title);
    formData.append("description", localProject.description);
    formData.append("status", localProject.status);

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload report");
      }

      const updatedProject = await response.json();
      setLocalProject((prev) => ({
        ...prev,
        ...updatedProject, // Ensure the `id` and other fields are updated
      }));
      alert("Report added successfully!");
    } catch (err) {
      console.error("Error uploading report:", err);
      alert("Failed to upload report. Please try again.");
    } finally {
      setReportUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      // Remove the deleted report from the local state
      setLocalProject((prev) => ({
        ...prev,
        reports: prev.reports.filter((report) => report.id !== reportId),
      }));

      alert("Report deleted successfully!");
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report. Please try again.");
    }
  };

  const handleUpdateProject = async () => {
    if (!localProject?.id) {
      alert("Project ID is missing. Please refresh the page and try again.");
      return;
    }

    if (!window.confirm("Are you sure you want to update this project?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localProject.title,
          description: localProject.description,
          status: localProject.status,
          media: localMedia,
          reports: localProject.reports,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update project");
      }

      alert("✅ Project updated successfully!");
      await fetchProjectDetails();
    } catch (err) {
      console.error("❌ Network error:", err);
      alert("❌ Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = async () => {
    if (!localProject?.id) {
      alert("Project ID is missing. Please refresh the page and try again.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete project");
      }

      alert("Project deleted successfully!");
      navigate(userRole === "mp" ? "/mp-dashboard" : "/public-dashboard");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleDeleteMedia = async (publicId) => {
    if (!window.confirm("Are you sure you want to delete this media?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${localProject.id}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId }),
      });
      if (!response.ok) throw new Error("Failed to delete media");
      setLocalMedia((prev) => prev.filter((m) => m.public_id !== publicId));
      alert("Media deleted successfully!");
    } catch (err) {
      console.error("Error deleting media:", err);
      alert("Failed to delete media.");
    }
  };

  if (loading) return <div>Loading project...</div>;
  if (error) return <div>{error}</div>;
  if (!localProject) return <div>Project not found</div>;

  return (
    <div className="project-details-container">
      <input
        type="file"
        id="mediaUploadInput"
        style={{ display: "none" }}
        onChange={(e) => handleFileUpload(e.target.files[0])}
      />

      <div className="header">
        <h1>{localProject.title}</h1>
        {userRole === "mp" ? (
          <div>
            <label>Status: </label>
            <select value={localProject.status} onChange={handleStatusChange}>
              <option value="ongoing">ongoing</option>
              <option value="completed">completed</option>
            </select>
          </div>
        ) : (
          <p>
            Status: <strong>{localProject.status}</strong>
          </p>
        )}
      </div>

      <div className="project-overview">
        <h2>Project Overview</h2>
        {editMode && userRole === "mp" ? (
          <textarea
            value={localProject.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
        ) : (
          <p>{localProject.description}</p>
        )}
        {userRole === "mp" && (
          <button className="action-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Save Description" : "Edit Description"}
          </button>
        )}
      </div>

      <div className="project-media">
        <h2>Media Gallery</h2>
        {localMedia.length > 0 ? (
          localMedia.map((media, idx) => (
            <div key={media.public_id || idx} className="media-item">
              {media.type === "image" ? (
                <img src={media.url} alt="" />
              ) : (
                <video
  src={media.url}
  controls
  poster={media.url.replace(/\.mp4$/, ".jpg")}
  preload="metadata"
  playsInline
/>

              )}
              <div className="media-comment">
                <p>Comment: {media.comment || "No comment"}</p>
                {userRole === "mp" && (
                  <>
                    <textarea
                      placeholder="Comment..."
                      value={mediaComments[idx] ?? media.comment}
                      onChange={(e) => handleCommentChange(idx, e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button className="action-btn" onClick={() => saveComment(idx)}>
                        Save Comment
                      </button>
                      <button className="action-btn" onClick={() => deleteComment(idx)}>
                        Delete Comment
                      </button>
                      <button className="action-btn" onClick={() => handleDeleteMedia(media.public_id)}>
                        Delete Media
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No media available.</p>
        )}
        {userRole === "mp" && (
          <div style={{ marginTop: "16px" }}>
            <button className="action-btn" onClick={handleAddMedia}>
              {uploading ? "Uploading..." : "Add Media"}
            </button>
          </div>
        )}
      </div>

      <div className="project-report">
        <h2>Project Reports</h2>
        {localProject.reports.length > 0 ? (
          localProject.reports.map((report) => (
            <div key={report.id} className="report-item">
              <a
                href={`${API_BASE_URL}/api/projects/${localProject.id}/reports/${report.id}/download`}
                download={report.fileName}
                target="_blank"
                rel="noopener noreferrer"
              >
                {report.fileName || "View Report"}
              </a>
              {userRole === "mp" && (
                <button
                  className="action-btn"
                  onClick={() => handleDeleteReport(report.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete Report
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No reports available.</p>
        )}
        {userRole === "mp" && (
          <div style={{ marginTop: "10px" }}>
            <button
              className="action-btn"
              onClick={() => document.getElementById("reportUploadInput").click()}
            >
              {reportUploading ? "Uploading..." : "Add Report"}
            </button>
            <input
              type="file"
              id="reportUploadInput"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.type === "application/pdf") {
                  handleAddReport(file);
                } else {
                  alert("Invalid file type. Please upload a PDF file.");
                }
              }}
            />
          </div>
        )}
      </div>

      {userRole === "mp" && (
        <div className="button-group">
          <button className="action-btn" onClick={handleUpdateProject}>
            Update Project
          </button>
          <button
            className="action-btn"
            style={{ backgroundColor: "red", borderColor: "red" }}
            onClick={handleDeleteProject}
          >
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
