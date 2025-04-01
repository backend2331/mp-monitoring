import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const ProjectDetails = ({ projects }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects?.find((p) => p.id === parseInt(id));

  if (!project) {
    return <h2 className="container">Project not found</h2>;
  }

  return (
    <div className="project-details-container">
      <h1>{project.title}</h1>
      <p className="project-description">{project.description}</p>

      {/* Media Section */}
      <div className="project-media">
        {project.mediaType === "image" ? (
          <img src={project.mediaUrl} alt="Project media" />
        ) : project.mediaType === "video" ? (
          <video controls>
            <source src={project.mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="button-group">
        <button className="action-btn" onClick={() => navigate(`/update-project/${project.id}`)}>
          Update
        </button>
        <button className="action-btn" onClick={() => navigate(`/delete-project/${project.id}`)}>
          Delete
        </button>
        <button className="action-btn" onClick={() => navigate("/")}>
          Back
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;
