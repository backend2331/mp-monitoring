import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", margin: "50px" }}>
      <h1>Welcome to MP Monitoring Dashboard</h1>
      <p>Please choose your role:</p>
      <button 
        onClick={() => navigate("/mp")} 
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        I'm an MP
      </button>
      <button 
        onClick={() => navigate("/public")} 
        style={{ margin: "10px", padding: "10px 20px" }}
      >
        I'm a Public Visitor
      </button>
    </div>
  );
};

export default LandingPage;
