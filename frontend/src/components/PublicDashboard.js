import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const PublicDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load projects");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container">
      {/* Header with title and total projects count on the top right */}
      <div className="header">
        <h1>Public Dashboard</h1>
        <div className="project-count">
          <p>Total Projects: {projects.length}</p>
        </div>
      </div>
      
      <p>Projects are visible here for public users.</p>
      
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.id} className="project-item">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              {/* Media Section */}
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

              {/* View Project Button */}
              <div className="button-group">
                <button
                  className="action-btn"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
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