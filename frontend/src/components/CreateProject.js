// src/components/CreateProject.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const CreateProject = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [constituency, setConstituency] = useState("Ayawaso");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status,
          created_by: 1,       // replace with real MP ID
          constituency,
        }),
      });
      if (!response.ok) throw new Error();
      const newProject = await response.json();
      alert("Project created!");
      navigate(`/mp-project/${newProject.id}`);
    } catch {
      alert("Failed to create project.");
    }
  };

  return (
    <div className="container">
      <h1>Create New Project</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            className="form-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief project description"
            rows={4}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-group half">
            <label htmlFor="constituency">Constituency</label>
            <input
              id="constituency"
              className="form-input"
              type="text"
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              placeholder="e.g. Ayawaso"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="action-btn">
            Create Project
          </button>
          <button
            type="button"
            className="action-btn secondary"
            onClick={() => navigate("/mp-dashboard")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
