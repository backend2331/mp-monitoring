import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Use for navigation
import "../App.css";

const MPDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Navigation hook

  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
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

  const handleProjectClick = (id) => {
    // Now navigate to /project/:id
    navigate(`/project/${id}`);
  };

  const handleAddMedia = (id) => {
    console.log("Add media to project", id);
  };

  const handleUpdateProject = (id) => {
    console.log("Update project", id);
  };

  const handleDeleteProject = (id) => {
    console.log("Delete project", id);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>MP Monitoring Dashboard</h1>
        <button className="create-project-btn">Create Project</button>
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
              <h3
                className="project-title"
                onClick={() => handleProjectClick(project.id)}
                style={{ cursor: "pointer" }}
              >
                {project.name}
              </h3>
              <p className="project-description">{project.description}</p>

              <div className="button-group">
                <button className="action-btn" onClick={() => handleAddMedia(project.id)}>
                  Add Media
                </button>
                <button className="action-btn" onClick={() => handleUpdateProject(project.id)}>
                  Update
                </button>
                <button className="action-btn" onClick={() => handleDeleteProject(project.id)}>
                  Delete
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleProjectClick(project.id)} // Add View Project Button
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
