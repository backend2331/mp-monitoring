import React, { useState, useEffect } from "react";
import "../App.css"; // Ensure you import your global styles

const PublicDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    fetch("http://localhost:5000/api/projects")
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false); // Set loading to false once data is fetched
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load projects");
        setLoading(false); // Set loading to false in case of error
      });
  }, []);

  // If data is still loading
  if (loading) {
    return <div>Loading projects...</div>;
  }

  // If there's an error
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container">
      <h1>Public Dashboard</h1>
      <p>Projects are visible here for public users.</p>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <ul className="project-list">
          {projects.map((project, index) => (
            <li key={index} className="project-item">
              <span className="project-title">{project.name}</span>
              <p className="project-description">{project.description}</p>

              {/* Media Section for Images and Videos */}
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

              {/* No "Add Media" button for public view */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublicDashboard;
