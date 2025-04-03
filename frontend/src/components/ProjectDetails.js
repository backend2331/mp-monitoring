import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../App.css";

const ProjectDetails = ({ userRole }) => {
  // Debug: log the userRole received from props
  console.log("ProjectDetails userRole:", userRole);

  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mediaComments, setMediaComments] = useState({});

  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Project not found");
        return response.json();
      })
      .then((data) => {
        data.status = data.status || "In Progress";
        data.media = data.media || [];
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

  const handleUpdateProject = () => {
    console.log("Update Project", project.id);
    alert("Project update functionality needs to be connected to the backend.");
  };

  const handleDeleteProject = () => {
    console.log("Delete Project", project.id);
    alert("Project delete functionality needs to be connected to the backend.");
  };

  const handleAddMedia = () => {
    console.log("Add Media", project.id);
    alert("Add media functionality needs to be connected to the backend.");
  };

  if (loading) return <div className="container">Loading project...</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!project) return <div className="container">Project not found</div>;

  return (
    <div className="project-details-container">
      {/* Header Area */}
      <div className="header">
        <h1>{project.title}</h1>
        <p>
          Status: <strong>{project.status}</strong>
        </p>
      </div>

      {/* Project Overview Section */}
      <div className="project-overview">
        <h2>Project Overview</h2>
        {editMode && userRole === "mp" ? (
          <textarea
            value={project.description}
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            }
          />
        ) : (
          <p>{project.description}</p>
        )}
        {userRole === "mp" && (
          <button
            className="action-btn"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Save Description" : "Edit Description"}
          </button>
        )}
      </div>

      {/* Media and Reports Section */}
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
                  <button
                    className="action-btn"
                    onClick={() => saveComment(idx)}
                  >
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
            Add Media
          </button>
        )}
      </div>

      <div className="project-report">
        <h2>Project Report</h2>
        {project.report_url ? (
          <embed
            src={project.report_url}
            width="100%"
            height="600px"
            type="application/pdf"
          />
        ) : (
          <p>No report available for this project.</p>
        )}
      </div>

      {/* CRUD Operations Panel: visible only for MPs */}
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