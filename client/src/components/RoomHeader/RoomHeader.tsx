import React, { useEffect, useState } from "react";
import "./RoomHeader.css";
import { useSocket } from "../../context/socketContext";

interface RoomHeaderProps {
  title: string;
  password: string;
  roomID: string;
  onLeave: () => void;
  hostSocketId: string;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
  title,
  password,
  roomID,
  onLeave,
  hostSocketId,
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("CODE_SYNC_THEME") !== "light";
  });
  const socket = useSocket();
  const role = hostSocketId === socket?.id ? "HOST" : "GUEST";

  const [lastEditedBy, setLastEditedBy] = useState<string>("");


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("CODE_SYNC_THEME", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("CODE_SYNC_THEME", "light");
    }
  }, [darkMode]);


  useEffect(() => {
    if (!socket) return;

    socket.on("code-update", ({ editorName }) => {
      setLastEditedBy(editorName);
    });

    return () => {
      socket.off("code-update");
    };
  }, [socket]);

  return (
    <header className="room-header">
      <div className="room-info">
        <div className="title-role">
          <h2 className="room-title">{title || "Untitled room"}</h2>
          <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
        </div>
        <p className="room-meta">
          <span>
            Room ID: <strong>{roomID}</strong>
          </span>
          <span>
            {" "}
            | Pass: <strong>{password}</strong>
          </span>
        </p>
        {lastEditedBy && (
          <p className="last-edited">
            Last edited by: <strong>{lastEditedBy}</strong>
          </p>
        )}
      </div>
      <div className="room-actions">
        <button className="dark-toggle-btn" onClick={()=>setDarkMode((mode)=>!mode)}>
          {darkMode ? (
            <>
              Light Mode <i className="bi bi-sun"></i>
            </>
          ) : (
            <>
              Dark Mode <i className="bi bi-moon"></i>
            </>
          )}
        </button>

        <button className="leave-btn" onClick={onLeave}>
          {role === "HOST" ? "End Session" : "Leave"}{" "}
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  );
};

export default RoomHeader;
