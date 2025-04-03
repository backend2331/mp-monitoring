import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import "../App.css";

const MPDashboard = () => {
  const [projects, setProjects] = useState([]); // Project list
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const navigate = useNavigate(); // Navigation hook

  useEffect(() => {
    fetch("http://localhost:5000/api/projects") // Fetching projects from API
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>MP Monitoring Dashboard</h1>
        {/* Optional: Add Project button if required */}
      </div>
      <div className="project-count">
        <p>Total Projects: {projects.length}</p>
      </div>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.id} className="project-item">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
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

export default MPDashboard;