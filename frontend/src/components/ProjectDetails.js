import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../App.css";

const ProjectDetails = ({ userRole }) => {
  console.log("ProjectDetails userRole:", userRole); // For debugging
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mediaComments, setMediaComments] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Project not found");
        return response.json();
      })
      .then((data) => {
        data.media = data.media || []; // Ensure media exists
        data.status = data.status || "In Progress";
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
        setError("Failed to load project. Please try again later.");
        setLoading(false);
      });
  }, [id]);

  const handleCommentChange = (index, value) => {
    setMediaComments((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const saveComment = (index) => {
    const updatedMedia = [...project.media];
    updatedMedia[index].comment = mediaComments[index] || "";
    setProject({ ...project, media: updatedMedia });
    setMediaComments((prev) => ({
      ...prev,
      [index]: "",
    }));
  };

  const handleUpdateProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/update/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          report_url: project.report_url,
        }),
      });

      if (response.ok) {
        alert("Project updated successfully!");
      } else {
        throw new Error("Failed to update project.");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/projects/delete/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Project deleted successfully!");
      } else {
        throw new Error("Failed to delete project.");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("media", file);

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/media`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Media upload failed");
      }

      const newMedia = await response.json();
      setProject((prevProject) => ({
        ...prevProject,
        media: [...prevProject.media, newMedia],
      }));
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

  if (loading) return <div>Loading project...</div>;
  if (error) return <div>{error}</div>;
  if (!project) return <div>Project not found</div>;

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
      <div className="header">
        <h1>{project.title}</h1>
        <p>
          Status: <strong>{project.status}</strong>
        </p>
      </div>
      <div className="project-overview">
        <h2>Project Overview</h2>
        {editMode && userRole === "mp" ? (
          <textarea
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
          />
        ) : (
          <p>{project.description}</p>
        )}
        {userRole === "mp" && (
          <button className="action-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Save Description" : "Edit Description"}
          </button>
        )}
      </div>
      <div className="project-media">
        <h2>Media Gallery</h2>
        {project.media.length > 0 ? (
          project.media.map((media, idx) => (
            <div key={idx} className="media-item">
              {media.type === "image" ? (
                <img src={media.url} alt={`Media ${idx}`} />
              ) : media.type === "video" ? (
                <video src={media.url} controls />
              ) : null}
              {userRole === "mp" && (
                <div className="media-comment">
                  <p>Comment: {media.comment || "No comment"}</p>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={mediaComments[idx] || ""}
                    onChange={(e) => handleCommentChange(idx, e.target.value)}
                  />
                  <button className="action-btn" onClick={() => saveComment(idx)}>
                    Save Comment
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No media available for this project.</p>
        )}
        {userRole === "mp" && (
          <button className="action-btn" onClick={handleAddMedia}>
            {uploading ? "Uploading..." : "Add Media"}
          </button>
        )}
      </div>
      <div className="project-report">
        <h2>Project Report</h2>
        {project.report_url ? (
          <embed src={project.report_url} width="100%" height="600px" type="application/pdf" />
        ) : (
          <p>No report available for this project.</p>
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