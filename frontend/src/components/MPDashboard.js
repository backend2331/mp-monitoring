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

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/", { replace: true }); // Redirect to landing page
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/mp-dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
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

  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear the token and redirect to the landing page
    localStorage.removeItem("authToken");
    navigate("/", { replace: true }); // Replace history to prevent going back
  };

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ overflowX: "hidden" }}>
      <div className="container">
        {/* Header Section */}
        <div className="header">
          <h1>MP Monitoring Dashboard</h1>
        </div>

        {/* Logout Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "16px",
          }}
        >
          <button
            className="action-btn"
            style={{
              backgroundColor: "red",
              borderColor: "red",
              color: "white",
              padding: "10px 16px",
              borderRadius: "4px",
              fontSize: "16px",
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Dashboard Controls */}
        <div
          className="dashboard-controls"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
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
              minWidth: "200px",
              flexGrow: 1,
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button className="action-btn" onClick={handleSearch}>
            Search
          </button>
          <button
            className="action-btn create-btn"
            onClick={() => navigate("/create-project")}
          >
            Create Project
          </button>
        </div>

        {/* Project List */}
        <p>Total Projects: {filteredProjects.length}</p>
        {filteredProjects.length === 0 ? (
          <p>No projects available.</p>
        ) : (
          <ul className="project-list">
            {filteredProjects.map((project) => (
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
    </div>
  );
};

export default MPDashboard;
