import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const PublicDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of projects");
        }
        setProjects(data);
        setFilteredProjects(data);
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
    <div style={{ overflowX: "hidden" }}>
      <div className="container">
      <div className="header">
  <h1>Public Dashboard</h1>

  {/* Total Projects Count Below the Heading */}
  <p style={{ fontWeight: "bold", margin: "10px 0" }}>
    Total Projects: {filteredProjects.length}
  </p>

  {/* Search Section */}
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "16px",
    }}
  >
    <input
      type="text"
      placeholder="Search by project title"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{
        padding: "8px",
        width: "250px",
        maxWidth: "100%",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    />
    <button className="action-btn" onClick={handleSearch}>
      Search
    </button>
  </div>
</div>


        {filteredProjects.length === 0 ? (
          <p>No projects available.</p>
        ) : (
          <ul className="project-list">
            {filteredProjects.map((project) => {
              const firstImage = project.media?.find((m) => m.type === "image");

              return (
                <li key={project.id} className="project-item">
                  <h3 className="project-number">Project ID: {project.id}</h3>
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">{project.description}</p>

                  <div className="project-media">
                    {firstImage ? (
                      <div className="media-item">
                        <img src={firstImage.url} alt="Project media" />
                      </div>
                    ) : (
                      <p>No image available for this project.</p>
                    )}
                  </div>

                  <div className="button-group">
                    <button
                      className="action-btn"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      View Project
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PublicDashboard;
