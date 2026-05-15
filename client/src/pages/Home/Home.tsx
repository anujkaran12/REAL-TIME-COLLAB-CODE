import React from "react";
import "./Home.css";
import { useAuth } from "../../context/authContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { setOpenAuthFormType } = useAuth();
  const { userData } = useSelector((state: RootState) => state.User);
  const navigate = useNavigate();

  const primaryAction = () => {
    if (userData) {
      navigate("/dashboard");
      return;
    }

    setOpenAuthFormType("REGISTER");
  };

  return (
    <main className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="bi bi-code-square"></i>
            Collaborative IDE for interviews, labs, and teams
          </div>

          <h1 className="hero-title">
            Code together without losing the room context.
          </h1>

          <p className="hero-copy">
            Code Sync combines a shared editor, secure room access, live
            execution, chat, and saved session history so a coding session
            stays useful after everyone leaves.
          </p>

          <div className="syntax-line" aria-label="Code Sync product summary">
            <span className="syntax-keyword">const</span>{" "}
            <span className="syntax-function">session</span>{" "}
            <span>=</span>{" "}
            <span className="syntax-function">createRoom</span>
            <span>(</span>
            <span className="syntax-string">"team-debugging"</span>
            <span>);</span>
          </div>

          <div className="hero-stats">
            <div>
              <strong>Live</strong>
              <span>presence, chat, and code updates</span>
            </div>
            <div>
              <strong>Run</strong>
              <span>multi-language code execution</span>
            </div>
            <div>
              <strong>Replay</strong>
              <span>saved room history and members</span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn primary" onClick={primaryAction}>
              {userData ? "Open Dashboard" : "Get Started"}
              <i className="bi bi-arrow-right"></i>
            </button>
            {!userData && (
              <button
                className="btn secondary"
                onClick={() =>
                  document
                    .getElementById("platform")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Platform
              </button>
            )}
          </div>
        </div>

        <div className="room-visual" aria-label="Code Sync room activity">
          <div className="visual-header">
            <div className="window-controls">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>room://react-debugging</span>
          </div>

          <div className="room-sections">
            <article className="room-section code-section">
              <div className="section-meta">
                <span className="section-dot"></span>
                <em>coding</em>
                <strong>sync-room.ts</strong>
              </div>
              <pre>
                <span className="syntax-keyword">const</span>{" "}
                <span className="syntax-function">room</span>{" "}
                <span>= </span>
                <span className="syntax-function">createRoom</span>
                <span>({"{"}</span>
                {"\n  "}title: <span className="syntax-string">"React debugging"</span>,
                {"\n  "}liveCode: <span className="syntax-keyword">true</span>,
                {"\n  "}saveHistory: <span className="syntax-keyword">true</span>,
                {"\n"}
                <span>{"}"});</span>
              </pre>
            </article>

            <article className="room-section">
              <div className="section-meta">
                <span className="section-dot"></span>
                <em>chat</em>
                <strong>Priya</strong>
              </div>
              <p>Can you keep the failing test visible while I patch auth state?</p>
              <span className="section-status">2 replies</span>
            </article>

            <article className="room-section">
              <div className="section-meta">
                <span className="section-dot"></span>
                <em>runner</em>
                <strong>Node.js 18</strong>
              </div>
              <p>Test run finished: 8 passed, 1 failed</p>
              <span className="section-status">open output</span>
            </article>

            <article className="room-section">
              <div className="section-meta">
                <span className="section-dot"></span>
                <em>history</em>
                <strong>09:19:02</strong>
              </div>
              <p>Room snapshot saved with code, chat, output, and participants.</p>
              <span className="section-status">saved</span>
            </article>
          </div>
        </div>
      </section>

      <section className="use-case-strip" id="use-cases">
        <div>
          <strong>Technical interviews</strong>
          <span>Host candidates in controlled rooms with runnable code.</span>
        </div>
        <div>
          <strong>Classroom labs</strong>
          <span>Let students pair up while instructors review session traces.</span>
        </div>
        <div>
          <strong>Remote debugging</strong>
          <span>Share the problem, output, and discussion in one workspace.</span>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading">
          <p>Platform</p>
          <h2>Built around the lifecycle of a real coding room.</h2>
        </div>

        <div className="platform-grid">
          <article className="platform-card">
            <i className="bi bi-door-open"></i>
            <h3>Room control</h3>
            <p>
              Create password-protected rooms with capacity limits and clear
              host/guest roles.
            </p>
          </article>
          <article className="platform-card">
            <i className="bi bi-terminal"></i>
            <h3>Execution flow</h3>
            <p>
              Edit together, switch languages, run code, and inspect output
              without leaving the room.
            </p>
          </article>
          <article className="platform-card">
            <i className="bi bi-archive"></i>
            <h3>Session memory</h3>
            <p>
              Preserve recent rooms, last code, collaborators, and activity so
              the work remains reusable.
            </p>
          </article>
        </div>
      </section>

      <section className="timeline-section" id="how-it-works">
        <div className="section-heading">
          <p>Workflow</p>
          <h2>From room creation to a saved coding record.</h2>
        </div>

        <div className="timeline">
          <div>
            <span>01</span>
            <h3>Open the room</h3>
            <p>Define the title, password, and participant limit.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Work in sync</h3>
            <p>Collaborate with live code, chat, participants, and output.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Keep the trail</h3>
            <p>Return to saved sessions from the workspace dashboard.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
