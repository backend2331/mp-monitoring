import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../App.css";

const ProjectDetails = ({ userRole }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [localProject, setLocalProject] = useState(null);
  const [localMedia, setLocalMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mediaComments, setMediaComments] = useState({});
  const [uploading, setUploading] = useState(false);
  const [reportUploading, setReportUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Project not found");
        return response.json();
      })
      .then((data) => {
        data.media = data.media || [];
        data.status = data.status || "ongoing";
        data.reports = data.reports || []; // ensure reports array
        setLocalProject({ ...data });
        setLocalMedia([...data.media]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
        setError("Failed to load project. Please try again later.");
        setLoading(false);
      });
  }, [id]);

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

  const deleteMedia = (index) => {
    if (window.confirm("Are you sure you want to delete this media?")) {
      setLocalMedia(localMedia.filter((_, idx) => idx !== index));
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("media", file);
    try {
      const response = await fetch(`/api/projects/${localProject.id}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Media upload failed");
      const newMedia = await response.json();
      setLocalMedia((prev) => [...prev, newMedia]);
      alert("Media uploaded successfully!");
    } catch {
      alert("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMedia = () => document.getElementById("mediaUploadInput").click();
  const handleStatusChange = (e) => handleFieldChange("status", e.target.value);

  const handleAddReport = async (file) => {
    const formData = new FormData();
    formData.append("newReports", file);
    formData.append("title", localProject.title); // Include title
    formData.append("description", localProject.description); // Include description
    formData.append("status", localProject.status); // Include status
    formData.append("fileName", file.name); // Include the original file name

    try {
      const response = await fetch(`/api/projects/${localProject.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload report");
      }

      const updatedProject = await response.json();
      setLocalProject(updatedProject); // Update the project state with the new report
      alert("Report added successfully!");
    } catch (error) {
      console.error("Error uploading report:", error);
      alert("Failed to add report");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const response = await fetch(
        `/api/projects/${localProject.id}/reports/${reportId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error();
      setLocalProject((prev) => ({
        ...prev,
        reports: prev.reports.filter((r) => r.id !== reportId),
      }));
      alert("Report deleted successfully!");
    } catch {
      alert("Failed to delete report.");
    }
  };

  const handleUpdateProject = async () => {
    if (!window.confirm("Are you sure you want to update this project?")) return;

    try {
      const response = await fetch(`/api/projects/${localProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localProject.title,
          description: localProject.description,
          status: localProject.status,
          media: localMedia, // Include updated media
          reports: localProject.reports, // Include updated reports
        }),
      });

      if (!response.ok) throw new Error("Failed to update project");

      alert("Project updated successfully!");

      // Fetch the updated project data to refresh the UI
      const updatedResponse = await fetch(`/api/projects/${localProject.id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        updatedData.media = updatedData.media || [];
        updatedData.reports = updatedData.reports || [];
        setLocalProject({ ...updatedData });
        setLocalMedia([...updatedData.media]);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`/api/projects/${localProject.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      alert("Project deleted successfully!");
      // Navigate based on user role
      if (userRole === "mp") {
        navigate("/mp-dashboard");
      } else {
        navigate("/public-dashboard");
      }
    } catch {
      alert("Failed to delete project.");
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm("Are you sure you want to delete this media?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete media");

      alert("Media deleted successfully!");
      // Refresh the media list after deletion
      fetchProjectDetails();
    } catch (error) {
      console.error("Error deleting media:", error);
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
        onChange={e => handleFileUpload(e.target.files[0])}
      />
      <input
        type="file"
        id="reportUploadInput"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={e => handleAddReport(e.target.files[0])}
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
          <p>Status: <strong>{localProject.status}</strong></p>
        )}
      </div>

      <div className="project-overview">
        <h2>Project Overview</h2>
        {editMode && userRole === "mp" ? (
          <textarea
            value={localProject.description}
            onChange={e => handleFieldChange("description", e.target.value)}
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
            <div key={idx} className="media-item">
              {media.type === "image" ? (
                <img src={media.url} alt="" />
              ) : (
                <video src={media.url} controls />
              )}
              <div className="media-comment">
                <p>Comment: {media.comment || "No comment"}</p>
                {userRole === "mp" && (
                  <>
                    <textarea
                      placeholder="Comment..."
                      value={mediaComments[idx] ?? media.comment}
                      onChange={e => handleCommentChange(idx, e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button className="action-btn" onClick={() => saveComment(idx)}>
                        Save Comment
                      </button>
                      <button className="action-btn" onClick={() => deleteComment(idx)}>
                        Delete Comment
                      </button>
                      <button className="action-btn" onClick={() => deleteMedia(idx)}>
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
                href={`/api/projects/${localProject.id}/reports/${report.id}/download`}
                download={report.fileName} // Optional, but ensures the correct file name
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
              accept=".pdf"
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
