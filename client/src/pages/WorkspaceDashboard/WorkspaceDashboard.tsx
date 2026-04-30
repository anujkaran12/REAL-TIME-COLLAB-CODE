import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { usePopup } from "../../context/popupContext";
import { useSocket } from "../../context/socketContext";
import RoomToggle from "../../components/RoomToggle/RoomToggle";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";
import "./WorkspaceDashboard.css";

type SessionParticipant = {
  name?: string;
  email?: string;
  avatar?: {
    secure_url?: string;
  };
};

type Session = {
  _id: string;
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

type RecentMember = SessionParticipant & {
  lastSessionTitle?: string;
  lastJoinedAt?: string;
};

const WorkspaceDashboard: React.FC = () => {
  const { userData, loading } = useSelector((state: RootState) => state.User);
  const [btnLoading, setButtonLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const { showPopup } = usePopup();
  const showPopupRef = useRef(showPopup);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    showPopupRef.current = showPopup;
  }, [showPopup]);

  const fetchDashboard = useCallback(async () => {
    if (!userData) {
      return;
    }

    try {
      setDashboardLoading(true);
      const token = localStorage.getItem(
        process.env.REACT_APP_AUTH_TOKEN as string
      );
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/dashboard/sessions`,
        {
          headers: {
            Authorization: token as string,
          },
        }
      );
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      if (!response.ok) {
        showPopupRef.current(
          data?.msg || data?.error || "Unable to load dashboard",
          "ERROR"
        );
        return;
      }
      setSessions(data.sessions || []);
      setRecentMembers(data.recentMembers || []);
    } catch (error) {
      showPopupRef.current("Network error while loading dashboard", "ERROR");
    } finally {
      setDashboardLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    socket?.on(
      "join-room-check-valid",
      ({ roomID, roomPassword, msg, type }) => {
        showPopupRef.current(msg, type);
        setButtonLoading(false);
        if (type === "SUCCESS") {
          navigate(`/Playground?ID=${roomID}&pass=${roomPassword}`);
        }
      }
    );

    socket?.on("room-create-log", ({ msg, type, data }) => {
      setButtonLoading(false);
      showPopupRef.current(msg, type);
      fetchDashboard();
      navigate(`/Playground?ID=${data.roomID}&pass=${data.roomPassword}`);
    });

    return () => {
      socket?.off("join-room-check-valid");
      socket?.off("room-create-log");
    };
  }, [fetchDashboard, navigate, socket]);

  const handleJoinRoom = (roomID: string, roomPassword: string) => {
    if (!socket) {
      showPopup("Socket not connected", "ERROR");
      return;
    }
    setButtonLoading(true);
    socket.emit("check-room", { roomID, roomPassword });
  };

  const handleCreateRoom = (
    roomTitle: string,
    roomPassword: string,
    maxParticipants: number
  ) => {
    if (!socket) {
      showPopup("Socket not connected", "ERROR");
      return;
    }
    setButtonLoading(true);
    socket.emit("create-room", {
      roomTitle,
      roomPassword,
      maxParticipants,
      userData,
      hostUserId: userData?._id,
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (!userData) {
    return <NotLoggedIn />;
  }

  return (
    <main className="workspace-dashboard">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-kicker">Workspace</p>
          <h1>{userData.name}'s coding rooms</h1>
          <p>
            Create focused coding sessions, limit room size, and jump back into
            recent collaboration history.
          </p>
        </div>
        <div className="dashboard-stats">
          <div>
            <strong>{sessions.length}</strong>
            <span>Rooms created</span>
          </div>
          <div>
            <strong>{recentMembers.length}</strong>
            <span>Recent members</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <RoomToggle
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            btnLoading={btnLoading}
          />
        </div>

        <div className="dashboard-panel session-panel">
          <div className="panel-heading">
            <div>
              <p className="dashboard-kicker">Sessions</p>
              <h2>Created rooms</h2>
            </div>
            <button onClick={fetchDashboard} disabled={dashboardLoading}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>

          {dashboardLoading ? (
            <Loading />
          ) : sessions.length === 0 ? (
            <p className="empty-state">No rooms created yet.</p>
          ) : (
            <div className="session-list">
              {sessions.map((session) => (
                <article
                  className="session-row"
                  key={session._id}
                  onClick={() => navigate(`/Dashboard/rooms/${session.roomID}`)}
                >
                  <div>
                    <h3>{session.roomTitle}</h3>
                    <p>
                      ID {session.roomID} · {session.participants.length}/
                      {session.maxParticipants} members
                    </p>
                  </div>
                  <div className="session-actions">
                    <span className={`session-status ${session.status.toLowerCase()}`}>
                      {session.status}
                    </span>
                    <button
                      className="history-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/Dashboard/rooms/${session.roomID}`);
                      }}
                    >
                      View history
                    </button>
                    {session.status === "ACTIVE" && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(
                            `/Playground?ID=${session.roomID}&pass=${session.roomPassword}`
                          );
                        }}
                      >
                        Open
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="dashboard-panel members-panel">
          <p className="dashboard-kicker">People</p>
          <h2>Recent members</h2>
          {recentMembers.length === 0 ? (
            <p className="empty-state">Members will appear after guests join.</p>
          ) : (
            <div className="member-list">
              {recentMembers.map((member, index) => (
                <div className="member-row" key={`${member.email}-${index}`}>
                  {member.avatar?.secure_url ? (
                    <img src={member.avatar.secure_url} alt={member.name} />
                  ) : (
                    <span>{member.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                  <div>
                    <strong>{member.name || "Unknown user"}</strong>
                    <p>{member.lastSessionTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};

export default WorkspaceDashboard;
