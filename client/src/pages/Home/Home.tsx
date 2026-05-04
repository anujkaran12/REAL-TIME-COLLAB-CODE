import editorImg from "../../assets/editor.png";
import React from "react";
import "./Home.css";
import { useAuth } from "../../context/authContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { setOpenAuthFormType } = useAuth();
  const { userData } = useSelector((state: RootState) => state.User);
  const navigate = useNavigate()
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-left">
          <h1 className="hero-title">
            <span>CODE SYNC</span>
            <br />
            Collaborate in Real-Time <br />
            Code Together <br /> AI Suggesstion
          </h1>

          {/* Hero Features */}
          <div className="hero-highlights">
            <div className="highlight">
              <i className="bi bi-people-fill"></i>
              <span>Team Collaboration</span>
            </div>
            <div className="highlight">
              <i className="bi bi-robot"></i>
              <span>AI Assistance</span>
            </div>
            <div className="highlight">
              <i className="bi bi-shield-lock-fill"></i>
              <span>Secure & Encrypted</span>
            </div>
            <div className="highlight">
              <i className="bi bi-cloud-arrow-up-fill"></i>
              <span>Cloud Backups</span>
            </div>
            <div className="highlight">
              <i className="bi bi-code-slash"></i>
              <span>Multi-language Support</span>
            </div>
            <div className="highlight">
              <i className="bi bi-kanban-fill"></i>
              <span>Project Management</span>
            </div>

            <div className="highlight">
              <i className="bi bi-person-check-fill"></i>
              <span>Role Control</span>
            </div>
            <div className="highlight">
              <i className="bi bi-award-fill"></i>
              <span>Top Contributors</span>
            </div>
          </div>

          {/* Call-to-Action */}

          <div className="hero-buttons">
            {!userData ? (
              <>
                <button
                  className="btn primary"
                  onClick={() => setOpenAuthFormType("REGISTER")}
                >
                  Get Started
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setOpenAuthFormType("LOGIN")}
                >
                  Sign In
                </button>
              </>
            ) : (
              
                <button
                  className="btn primary"
                  onClick={() => navigate("/dashboard")}
                >
                  Join | Create Room
                </button>
              
            )}
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-right-img">
            <img src={editorImg} alt="AI Coding Preview" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Choose Code Sync</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-time Collaboration</h3>
            <p>
              Work seamlessly with your team on the same project, regardless of
              location, and see changes instantly.
            </p>
          </div>
          <div className="feature-card">
            <h3>AI Assistance</h3>
            <p>
              Receive intelligent code suggestions, debugging tips, and
              autocompletion to accelerate development.
            </p>
          </div>
          <div className="feature-card">
            <h3>Multi-language Support</h3>
            <p>
              Supports all major programming languages, so your team can code in
              the language they prefer.
            </p>
          </div>
          <div className="feature-card">
            <h3>Secure & Reliable</h3>
            <p>
              End-to-end encryption ensures your code stays safe while cloud
              backups keep your work protected.
            </p>
          </div>
          <div className="feature-card">
            <h3>Version Control Integration</h3>
            <p>
              Seamlessly integrates with Git, allowing you to track changes and
              collaborate efficiently.
            </p>
          </div>
          <div className="feature-card">
            <h3>Customizable Workspaces</h3>
            <p>
              Create personalized coding environments for different projects and
              team members.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
