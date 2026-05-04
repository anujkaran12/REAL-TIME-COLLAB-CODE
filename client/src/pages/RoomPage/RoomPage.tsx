import React, { useEffect, useState } from "react";
import "./RoomPage.css";

import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { usePopup } from "../../context/popupContext";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/socketContext";
import RoomToggle from "../../components/RoomToggle/RoomToggle";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";

const RoomPage: React.FC = () => {
  const { userData, loading } = useSelector((state: RootState) => state.User);
  const [btnLoading, setButtonLoading] = useState(false);
  const { showPopup } = usePopup();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    socket?.on(
      "join-room-check-valid",
      ({ roomID, roomPassword, msg, type }) => {
        showPopup(msg, type);
        setButtonLoading(false);
        if (type === "SUCCESS") {
          navigate(`/playground?ID=${roomID}&pass=${roomPassword}`);
        }
      },
    );

    socket?.on("room-create-log", ({ msg, type, data }) => {
      setButtonLoading(false);
      showPopup(msg, type);
      navigate(`/playground?ID=${data.roomID}&pass=${data.roomPassword}`);
    });
    return () => {
      socket?.off("join-room-check-valid");
      socket?.off("room-create-log");
    };
  }, [socket, navigate, showPopup]);

  const handleJoinRoom = (roomID: string, roomPassword: string) => {
    if (!socket) {
      showPopup("Socket not connected", "ERROR");
      return;
    }
    setButtonLoading(true);

    socket.emit("check-room", { roomID, roomPassword });
  };
  const handleCreateRoom = async (
    roomTitle: string,
    roomPassword: string,
    maxParticipants: number,
  ) => {
    if (!socket) {
      showPopup("Socket not connected", "ERROR");
      return;
    }
    setButtonLoading(true);
    socket?.emit("create-room", {
      roomTitle,
      roomPassword,
      maxParticipants,
      userData,
      hostUserId: userData?._id,
    });
  };
  return (
    <>
      {loading ? (
        <Loading />
      ) : !userData ? (
        <NotLoggedIn />
      ) : (
        <div className="roomPage-container">
          <RoomToggle
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            btnLoading={btnLoading}
          />
        </div>
      )}
    </>
  );
};

export default RoomPage;
