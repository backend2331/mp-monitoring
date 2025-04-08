import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const MPDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects"); // Replaced hardcoded localhost with a relative URL
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of projects");
        }
        setProjects(data);
        setFilteredProjects(data); // initialize
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleSearch = () => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>MP Monitoring Dashboard</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by project title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px",
              width: "250px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button className="action-btn" onClick={handleSearch}>
            Search
          </button>
          <button
            className="action-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => navigate("/create-project")}
          >
            Create Project
          </button>
        </div>
      </div>

      <p>Total Projects: {filteredProjects.length}</p>

      {filteredProjects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul className="project-list">
          {filteredProjects.map((project, index) => (
            <li key={project.id} className="project-item">
              <h3 className="project-number">Project ID: {project.id}</h3>
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="button-group">
                <button
                  className="action-btn"
                  onClick={() => navigate(`/mp-project/${project.id}`)}
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
