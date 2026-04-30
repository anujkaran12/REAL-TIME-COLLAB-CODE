import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { usePopup } from "../../context/popupContext";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";
import "./RoomDetails.css";

type SessionParticipant = {
  name?: string;
  email?: string;
  role?: "HOST" | "GUEST";
  joinedAt?: string;
  leftAt?: string;
  avatar?: {
    secure_url?: string;
  };
};

type SessionDetails = {
  roomID: string;
  roomTitle: string;
  roomPassword: string;
  maxParticipants: number;
  status: "ACTIVE" | "ENDED";
  lastCode?: string;
  lastLanguage?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  participants: SessionParticipant[];
  createdAt: string;
  updatedAt: string;
};

const RoomDetails: React.FC = () => {
  const { roomID } = useParams();
  const navigate = useNavigate();
  const { userData, loading } = useSelector((state: RootState) => state.User);
  const { showPopup } = usePopup();
  const showPopupRef = useRef(showPopup);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    showPopupRef.current = showPopup;
  }, [showPopup]);

  const fetchSession = useCallback(async () => {
    if (!userData || !roomID) {
      return;
    }

    try {
      setSessionLoading(true);
      const token = localStorage.getItem(
        process.env.REACT_APP_AUTH_TOKEN as string
      );
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/dashboard/sessions/${roomID}`,
        {
          headers: {
            Authorization: token as string,
          },
        }
      );
      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        data = {
          msg: responseText.includes("Cannot GET")
            ? "Backend room-history route is not loaded. Restart the backend server."
            : "Unable to read room details response",
        };
      }

      if (!response.ok) {
        const message =
          data?.msg ||
          data?.error ||
          (response.status === 401
            ? "Please log in again to view room history"
            : response.status === 403
            ? "You do not have access to this room history"
            : response.status === 404
            ? "Room history not found"
            : "Unable to load room details");
        setPageError(message);
        showPopupRef.current(message, "ERROR");
        return;
      }

      setPageError("");
      setSession(data.session);
    } catch (error) {
      showPopupRef.current("Network error while loading room details", "ERROR");
    } finally {
      setSessionLoading(false);
    }
  }, [roomID, userData]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return <Loading />;
  }

  if (!userData) {
    return <NotLoggedIn />;
  }

  if (sessionLoading && !session) {
    return <Loading />;
  }

  if (!session) {
    return (
      <main className="room-details-page">
        <div className="room-details-empty">
          <h1>{pageError || "Room history not found"}</h1>
          <p>This page shows saved session history, not a live joinable room.</p>
          <button onClick={() => navigate("/Dashboard")}>Back to dashboard</button>
        </div>
      </main>
    );
  }

  const editedAt = session.lastEditedAt
    ? new Date(session.lastEditedAt).toLocaleString()
    : "Not edited yet";

  return (
    <main className="room-details-page">
      <section className="room-details-header">
        <div>
          <button className="back-link" onClick={() => navigate("/Dashboard")}>
            <i className="bi bi-arrow-left"></i> Dashboard
          </button>
          <p className="details-kicker">Room Session</p>
          <h1>{session.roomTitle}</h1>
          <p>
            ID {session.roomID} · {session.participants.length}/
            {session.maxParticipants} members
          </p>
        </div>
        <div className="room-detail-actions">
          <span className={`session-status ${session.status.toLowerCase()}`}>
            {session.status}
          </span>
          {session.status === "ACTIVE" && (
            <button
              onClick={() =>
                navigate(
                  `/Playground?ID=${session.roomID}&pass=${session.roomPassword}`
                )
              }
            >
              Open Editor
            </button>
          )}
        </div>
      </section>

      <section className="room-details-grid">
        <div className="room-details-panel code-panel">
          <div className="panel-heading">
            <div>
              <p className="details-kicker">Last Code</p>
              <h2>{session.lastLanguage || "javascript"}</h2>
            </div>
            <span>{editedAt}</span>
          </div>
          <div className="details-editor-shell">
            <Editor
              height="100%"
              width="100%"
              language={session.lastLanguage || "javascript"}
              value={session.lastCode || "No code has been saved for this room yet."}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                renderLineHighlight: "none",
                folding: true,
              }}
            />
          </div>
        </div>

        <aside className="room-details-panel">
          <p className="details-kicker">Members</p>
          <h2>Recent collaborators</h2>
          <div className="detail-member-list">
            {session.participants.length === 0 ? (
              <p className="detail-empty">No members joined this room yet.</p>
            ) : (
              session.participants.map((participant, index) => (
                <div className="detail-member-row" key={`${participant.email}-${index}`}>
                  {participant.avatar?.secure_url ? (
                    <img src={participant.avatar.secure_url} alt={participant.name} />
                  ) : (
                    <span>{participant.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                  <div>
                    <strong>{participant.name || "Unknown user"}</strong>
                    <p>{participant.role || "GUEST"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
};

export default RoomDetails;
