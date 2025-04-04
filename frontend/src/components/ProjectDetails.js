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
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Project not found");
        return response.json();
      })
      .then((data) => {
        data.media = data.media || [];
        data.status = data.status || "ongoing";
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
      const updated = localMedia.filter((_, idx) => idx !== index);
      setLocalMedia(updated);
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("media", file);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${localProject.id}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Media upload failed");
      const newMedia = await response.json();
      setLocalMedia((prev) => [...prev, newMedia]);
      alert("Media uploaded successfully!");
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMedia = () => {
    document.getElementById("mediaUploadInput").click();
  };

  const handleStatusChange = (e) => {
    handleFieldChange("status", e.target.value);
  };

  const handleReportUpload = async (file) => {
    setReportUploading(true);
    const formData = new FormData();
    formData.append("report", file);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${localProject.id}/report`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Report upload failed");
      const data = await response.json();
      setLocalProject((prev) => ({ ...prev, report_url: data.report_url }));
      alert("Report uploaded successfully!");
    } catch (error) {
      console.error("Error uploading report:", error);
      alert("Failed to upload report.");
    } finally {
      setReportUploading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!window.confirm("Are you sure you want to update this project?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${localProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localProject.title,
          description: localProject.description,
          report_url: localProject.report_url,
          status: localProject.status,
          media: localMedia,
        }),
      });
      if (!response.ok) throw new Error("Failed to update project.");
      alert("Project updated successfully!");
      const updatedResponse = await fetch(`http://localhost:5000/api/projects/${localProject.id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        updatedData.media = updatedData.media || [];
        setLocalProject({ ...updatedData });
        setLocalMedia([...updatedData.media]);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/projects/delete/${localProject.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project.");
      alert("Project deleted successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
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
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        id="reportUploadInput"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleReportUpload(e.target.files[0]);
          }
        }}
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
            <div key={idx} className="media-item">
              {media.type === "image" ? (
                <img src={media.url} alt={`Media ${idx}`} />
              ) : media.type === "video" ? (
                <video src={media.url} controls />
              ) : null}
              <div className="media-comment">
                <p>Comment: {media.comment || "No comment"}</p>
                {userRole === "mp" && (
                  <>
                    <textarea
                      placeholder="Add or update comment..."
                      value={
                        mediaComments[idx] !== undefined
                          ? mediaComments[idx]
                          : media.comment || ""
                      }
                      onChange={(e) => handleCommentChange(idx, e.target.value)}
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
          <p>No media available for this project.</p>
        )}
        {userRole === "mp" && (
          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            <button className="action-btn" onClick={handleAddMedia}>
              {uploading ? "Uploading..." : "Add Media"}
            </button>
          </div>
        )}
      </div>
      <div className="project-report">
        <h2>Project Report</h2>
        {localProject.report_url ? (
          <div>
            <embed src={localProject.report_url} width="100%" height="600px" type="application/pdf" />
            <p>
              <a href={localProject.report_url} target="_blank" rel="noopener noreferrer" download>
                Download Report
              </a>
            </p>
          </div>
        ) : (
          <p>No report available for this project.</p>
        )}
        {userRole === "mp" && (
          <div style={{ marginTop: "16px" }}>
            <button
              className="action-btn"
              onClick={() => document.getElementById("reportUploadInput").click()}
            >
              {reportUploading ? "Uploading Report..." : "Upload/Replace Report"}
            </button>
          </div>
        )}
      </div>
      {userRole === "mp" && (
        <div className="button-group">
          <button className="action-btn" onClick={handleUpdateProject}>
            Update Project
          </button>
          <button className="action-btn" onClick={handleDeleteProject}>
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
