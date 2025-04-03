import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import MPDashboard from "./components/MPDashboard";
import PublicDashboard from "./components/PublicDashboard";
import MPLogin from "./components/MPLogin";
import ProjectDetails from "./components/ProjectDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mp" element={<MPLogin />} />
        <Route path="/mp-dashboard" element={<MPDashboard />} />
        <Route path="/public" element={<PublicDashboard />} />
        {/* Public Detail View */}
        <Route path="/project/:id" element={<ProjectDetails userRole="public" />} />
        {/* MP Detail View */}
        <Route path="/mp-project/:id" element={<ProjectDetails userRole="mp" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;