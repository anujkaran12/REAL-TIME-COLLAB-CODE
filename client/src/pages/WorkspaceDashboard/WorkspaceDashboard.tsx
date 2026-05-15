import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { usePopup } from "../../context/popupContext";
import { useSocket } from "../../context/socketContext";
import RoomToggle from "../../components/RoomToggle/RoomToggle";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";
import RecentMembers from "./components/RecentMembers";
import SessionList from "./components/SessionList";
import WorkspaceHero from "./components/WorkspaceHero";
import { RecentMember, Session } from "./types";
import "./WorkspaceDashboard.css";

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
          navigate(`/playground?ID=${roomID}&pass=${roomPassword}`);
        }
      }
    );

    socket?.on("room-create-log", ({ msg, type, data }) => {
      setButtonLoading(false);
      showPopupRef.current(msg, type);
      fetchDashboard();
      navigate(`/playground?ID=${data.roomID}&pass=${data.roomPassword}`);
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
      <WorkspaceHero
        userName={userData.name}
        roomCount={sessions.length}
      />

      <section className="dashboard-grid">
        <div className="dashboard-panel room-panel">
          <RoomToggle
            handleCreateRoom={handleCreateRoom}
            handleJoinRoom={handleJoinRoom}
            btnLoading={btnLoading}
          />
        </div>

        <SessionList
          sessions={sessions}
          loading={dashboardLoading}
          onRefresh={fetchDashboard}
          onViewHistory={(roomID) => navigate(`/dashboard/rooms/${roomID}`)}
          onOpenRoom={(roomID, roomPassword) =>
            navigate(`/playground?ID=${roomID}&pass=${roomPassword}`)
          }
        />

        <RecentMembers members={recentMembers} />
      </section>
    </main>
  );
};

export default WorkspaceDashboard;
