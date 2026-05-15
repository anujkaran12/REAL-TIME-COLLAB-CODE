import React from "react";
import { Session } from "../types";

type SessionListProps = {
  sessions: Session[];
  loading: boolean;
  onRefresh: () => void;
  onViewHistory: (roomID: string) => void;
  onOpenRoom: (roomID: string, roomPassword: string) => void;
};

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  onRefresh,
  onViewHistory,
  onOpenRoom,
}) => {
  return (
    <div className="dashboard-panel session-panel">
      <div className="panel-heading">
        <div>
          <p className="dashboard-kicker">Sessions</p>
          <h2>Created rooms</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh sessions"
          className={loading ? "refresh-btn is-loading" : "refresh-btn"}
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="empty-state">
          {loading ? "Loading sessions..." : "No rooms created yet."}
        </p>
      ) : (
        <div className="session-list" aria-busy={loading}>
          {sessions.map((session) => {
            const guestCount = session.participants.filter(
              (participant) => participant.role !== "HOST"
            ).length;
            const guestLimit = Math.max(session.maxParticipants - 1, 1);

            return (
              <article
                className="session-row"
                key={session._id}
                onClick={() => onViewHistory(session.roomID)}
              >
                <div>
                  <h3>{session.roomTitle}</h3>
                  <p>
                    ID {session.roomID} · {guestCount}/{guestLimit} guests
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
                      onViewHistory(session.roomID);
                    }}
                  >
                    History
                  </button>
                  {session.status === "ACTIVE" && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenRoom(session.roomID, session.roomPassword);
                      }}
                    >
                      Open
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionList;
