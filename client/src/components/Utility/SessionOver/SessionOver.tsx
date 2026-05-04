import React from "react";
import "./SessionOver.css";
import { useNavigate } from "react-router-dom";

const SessionOver: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="session-over-container">
      <div className="session-over-card">
        <div className="session-over-icon">
          <i className="bi bi-door-closed"></i>
        </div>
        <h2>Session Ended</h2>
        <p className="session-over-text">
          This room is no longer active. Please create a new session or join another workspace to continue collaborating.
        </p>
        <div className="session-over-actions">
          <button className="session-over-btn" onClick={() => navigate("/")}>
            <i className="bi bi-house-door"></i> Go Home
          </button>
          <button className="session-over-btn primary" onClick={() => navigate("/dashboard")}>
            <i className="bi bi-plus-circle"></i> New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionOver;
