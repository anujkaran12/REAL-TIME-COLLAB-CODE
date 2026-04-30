import React, { useEffect, useState } from "react";
import "./RoomToggle.css";
import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";
import { usePopup } from "../../context/popupContext";

const ROOM_TITLE_MIN_LENGTH = 3;
const ROOM_TITLE_MAX_LENGTH = 50;
const ROOM_PASSWORD_MIN_LENGTH = 4;
const ROOM_PASSWORD_MAX_LENGTH = 20;

interface IRommTogglePROP {
  handleCreateRoom: (
    roomTitle: string,
    roomPassword: string,
    maxParticipants: number
  ) => void;
  handleJoinRoom: (roomID: string, roomPassword: string) => void;
  btnLoading: boolean;
  selectedRoom?: {
    roomID: string;
    roomPassword: string;
  } | null;
}

const RoomToggle: React.FC<IRommTogglePROP> = ({
  handleCreateRoom,
  handleJoinRoom,
  btnLoading,
  selectedRoom,
}) => {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [roomTitle, setRoomTitle] = useState("");
  const [roomID, setRoomID] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(5);
  const { showPopup } = usePopup();
  const [passwordType, setPasswordType] = useState("password");

  const passwordToggle = () => {
    if (passwordType === "text") {
      setPasswordType("password");
    } else {
      setPasswordType("text");
    }
  };

  useEffect(() => {
    if (!selectedRoom) {
      return;
    }

    setActiveTab("join");
    setRoomID(selectedRoom.roomID);
    setRoomPassword(selectedRoom.roomPassword);
  }, [selectedRoom]);

  return (
    <div className="room-toggle-container">
      {/* Toggle Buttons */}
      <div className="toggle-switch">
        <button
          className={activeTab === "join" ? "active" : ""}
          onClick={() => setActiveTab("join")}
        >
          Join Room
        </button>
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create Room
        </button>
        <div className={`slider ${activeTab}`} />
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "join" ? (
          <div className="form">
            <h3>JOIN ROOM</h3>
            <input
              className="input-letter-space"
              type="text"
              placeholder="Enter Room ID"
              value={roomID}
              onChange={(e) => setRoomID(e.target.value)}
              minLength={5}
            />
            <div style={{ position: "relative" }}>
              <input
                className="input-letter-space"
                type={passwordType}
                placeholder="Enter Room Password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                maxLength={5}
              />

              {passwordType === "password" ? (
                <i className="bi bi-eye" onClick={passwordToggle}></i>
              ) : (
                <i className="bi bi-eye-slash" onClick={passwordToggle}></i>
              )}
            </div>
            <button
              onClick={() => {
                if (!roomID.trim()) {
                  showPopup("Room ID required", "WARNING");
                  return;
                }

                if (!roomPassword.trim()) {
                  showPopup("Password Required", "WARNING");
                  return;
                }
                handleJoinRoom(roomID, roomPassword);
              }}
              disabled={btnLoading}
            >
              {btnLoading ? <ButtonLoader /> : "Join"}
            </button>
          </div>
        ) : (
          <div className="form">
            <h3>CREATE ROOM</h3>
            <input
              type="text"
              placeholder="Enter Room Title"
              value={roomTitle}
              minLength={ROOM_TITLE_MIN_LENGTH}
              maxLength={ROOM_TITLE_MAX_LENGTH}
              onChange={(e) => setRoomTitle(e.target.value)}
              required
            />
            <div style={{ position: "relative" }}>
              <input
                className="input-letter-space"
                type={passwordType}
                placeholder="Set Room Password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                minLength={ROOM_PASSWORD_MIN_LENGTH}
                maxLength={ROOM_PASSWORD_MAX_LENGTH}
                required
              />
              {passwordType === "password" ? (
                <i className="bi bi-eye" onClick={passwordToggle}></i>
              ) : (
                <i className="bi bi-eye-slash" onClick={passwordToggle}></i>
              )}
            </div>
            <select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              aria-label="Maximum participants"
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "person" : "people"} limit
                  </option>
                )
              )}
            </select>
            <button
              onClick={() => {
                if (!roomTitle.trim()) {
                  showPopup("Room title required", "WARNING");
                  return;
                }

                if (
                  roomTitle.trim().length < ROOM_TITLE_MIN_LENGTH ||
                  roomTitle.trim().length > ROOM_TITLE_MAX_LENGTH
                ) {
                  showPopup(
                    `Room title must be ${ROOM_TITLE_MIN_LENGTH}-${ROOM_TITLE_MAX_LENGTH} characters`,
                    "WARNING"
                  );
                  return;
                }

                if (!roomPassword.trim()) {
                  showPopup("Password Required", "WARNING");
                  return;
                }

                if (
                  roomPassword.trim().length < ROOM_PASSWORD_MIN_LENGTH ||
                  roomPassword.trim().length > ROOM_PASSWORD_MAX_LENGTH
                ) {
                  showPopup(
                    `Password must be ${ROOM_PASSWORD_MIN_LENGTH}-${ROOM_PASSWORD_MAX_LENGTH} characters`,
                    "WARNING"
                  );
                  return;
                }
                handleCreateRoom(roomTitle, roomPassword, maxParticipants);
              }}
              disabled={btnLoading}
            >
              {btnLoading ? <ButtonLoader /> : "Create"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomToggle;
