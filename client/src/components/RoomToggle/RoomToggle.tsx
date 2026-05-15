import React, { useEffect, useState } from "react";
import "./RoomToggle.css";
import ButtonLoader from "../Utility/ButtonLoader/ButtonLoader";
import { usePopup } from "../../context/popupContext";
import { Eye, EyeOff } from "lucide-react";

const ROOM_TITLE_MIN_LENGTH = 3;
const ROOM_TITLE_MAX_LENGTH = 50;
const ROOM_PASSWORD_MIN_LENGTH = 4;
const ROOM_PASSWORD_MAX_LENGTH = 20;
const GUEST_LIMIT_MIN = 1;
const GUEST_LIMIT_MAX = 20;

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
  const [guestLimit, setGuestLimit] = useState(5);
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
                minLength={ROOM_PASSWORD_MIN_LENGTH}
                maxLength={ROOM_PASSWORD_MAX_LENGTH}
              />

              {passwordType === "password" ? (
                <button
                  type="button"
                  className="room-password-toggle"
                  onClick={passwordToggle}
                  aria-label="Show room password"
                >
                  <Eye size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="room-password-toggle"
                  onClick={passwordToggle}
                  aria-label="Hide room password"
                >
                  <EyeOff size={18} />
                </button>
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
                handleJoinRoom(roomID.trim(), roomPassword.trim());
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
                <button
                  type="button"
                  className="room-password-toggle"
                  onClick={passwordToggle}
                  aria-label="Show room password"
                >
                  <Eye size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="room-password-toggle"
                  onClick={passwordToggle}
                  aria-label="Hide room password"
                >
                  <EyeOff size={18} />
                </button>
              )}
            </div>
            <div className="number-field">
              <input
                type="number"
                min={GUEST_LIMIT_MIN}
                max={GUEST_LIMIT_MAX}
                step={1}
                value={guestLimit}
                onChange={(e) => setGuestLimit(Number(e.target.value))}
                onBlur={() =>
                  setGuestLimit((limit) =>
                    Math.min(
                      Math.max(Number(limit) || GUEST_LIMIT_MIN, GUEST_LIMIT_MIN),
                      GUEST_LIMIT_MAX
                    )
                  )
                }
                aria-label="Guest limit excluding yourself"
              />
              <span>guest limit, excluding you</span>
            </div>
            <button
              onClick={() => {
                const normalizedGuestLimit = Math.min(
                  Math.max(Number(guestLimit) || GUEST_LIMIT_MIN, GUEST_LIMIT_MIN),
                  GUEST_LIMIT_MAX
                );

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
                handleCreateRoom(
                  roomTitle,
                  roomPassword,
                  normalizedGuestLimit + 1
                );
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
