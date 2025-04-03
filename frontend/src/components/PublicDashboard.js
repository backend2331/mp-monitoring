import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const PublicDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of projects");
        }
        setProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Public Dashboard</h1>
        <p>Total Projects: {projects.length}</p>
      </div>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project, index) => (
            <li key={project.id} className="project-item">
              <h3 className="project-number">Project Number: {index + 1}</h3>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-media">
                {project.media && project.media.length > 0 ? (
                  project.media.map((media, idx) => (
                    <div key={idx} className="media-item">
                      {media.type === "image" ? (
                        <img src={media.url} alt="project media" />
                      ) : media.type === "video" ? (
                        <video src={media.url} controls />
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>No media available for this project.</p>
                )}
              </div>
              <div className="button-group">
                <button className="action-btn" onClick={() => navigate(`/project/${project.id}`)}>
                  View Project
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublicDashboard;
