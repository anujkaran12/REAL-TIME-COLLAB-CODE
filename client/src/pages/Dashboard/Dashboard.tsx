import React, { useEffect, useState } from "react";
import CodeEditor from "../../components/Editor/Editor";
import Participants from "../../components/Participants/Participants";

import Output from "../../components/Output/Output";

import "./Dashboard.css";

import {
  CODE_SNIPPETS,
  ILanguagesVersion,
  LANGUAGE_VERSIONS,
} from "../../constants";
import { usePopup } from "../../context/popupContext";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Loading from "../../components/Utility/Loading/Loading";
import NotLoggedIn from "../../components/Utility/NotLoggedIn/NotLoggedIn";
import { useSocket } from "../../context/socketContext";
import SessionOver from "../../components/Utility/SessionOver/SessionOver";
import RoomHeader from "../../components/RoomHeader/RoomHeader";
import Chat from "../../Chat/Chat";

const Dashboard: React.FC = () => {
  const { showPopup } = usePopup();
  const socket = useSocket();
  const [output, setOutput] = useState<any>({});
  const [outputLoading, setOutputLoading] = useState<boolean>(false);
  const [existsRoom, setExistsRoom] = useState<boolean | null>(null);

  const [searchParams] = useSearchParams();
  const roomID = searchParams.get("ID");
  const roomPassword = searchParams.get("pass");
  const [code, setCode] = useState<string>(CODE_SNIPPETS["javascript"]);

  const navigate = useNavigate();

  const {
    userData,
    loading: userLoading,
    
  } = useSelector((state: RootState) => state.User);

  const [participantData, setParticipantData] = useState([]);
  const [roomData, setRoomData] = useState({
    roomTitle: "",
    roomPassword: "",
    hostSocketId: "",
  });
  // Socket join-room effect

  useEffect(() => {
    console.log("useEffect");

    if (!socket) {
      return;
    }

    if (!roomID || !roomPassword) {
      console.log("RD RP Not found");
      setExistsRoom(false);
      return;
    }
    if (socket.disconnected) {
      socket?.on("connect", () => {
        console.log("Connected to server: room-page ", socket?.id);
      });
    }

    socket.on("participant-left", ({ msg, socketID, data, type }) => {
      setParticipantData(data.participants);
      showPopup(msg, type);
    });

    socket.on("end-session", ({ msg, type }) => {
      showPopup(msg, type);
      setExistsRoom(false);
      setParticipantData([]);
      setRoomData({ roomTitle: "", roomPassword: "", hostSocketId: "" });
    });

    socket.on("removed-from-room", ({ msg, type }) => {
      showPopup(msg, type);
      setExistsRoom(false);
      setParticipantData([]);
      setRoomData({ roomTitle: "", roomPassword: "", hostSocketId: "" });
    });

    socket.on("participant-removed", ({ msg, type, data }) => {
      setParticipantData(data.participants);
      showPopup(msg, type);
    });
    socket.on("user-joined", ({ msg, type, data }) => {
      showPopup(msg, type);
      setParticipantData(data.participants);
    });

    socket.emit("join-room", { roomID, roomPassword, userData });

    socket.on("join-room-success", ({ msg, type, data }) => {
      setExistsRoom(true);
      setParticipantData(data.participants);
      if (data.lastCode) {
        setCode(data.lastCode);
      }
      showPopup(msg, type);
      setRoomData({
        roomTitle: data.roomTitle,
        roomPassword: data.roomPassword,
        hostSocketId: data.hostSocketId,
      });
      // console.log(data);
    });
    socket.on("join-room-error", ({ msg, type }) => {
      setExistsRoom(false);
      showPopup(msg, type);
    });

    socket.on("disconnect", () => console.log("Disconnected from server ROOM"));

    const handleBeforeUnload = () => {
      if (socket) {
        socket.emit("leave-room", { roomID, userData: userData });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (socket) {
        socket.emit("leave-room", { roomID, userData: userData });
        // socket.disconnect(); // <--- 🔥 ensures we fully disconnect
      }
      socket.off("join-room-success");
      socket.off("join-room-error");
      socket.off("user-joined");
      socket.off("participant-left");
      socket.off("end-session");
      socket.off("removed-from-room");
      socket.off("participant-removed");
    };
  }, [socket, roomID, roomPassword, userData,showPopup]);

  // Method to execute code
  const executeCode = async (language: string, sourceCode: string) => {
    try {
      setOutputLoading(true);
      const token = localStorage.getItem(
        process.env.REACT_APP_AUTH_TOKEN as string,
      );
      const BackendURL = process.env.REACT_APP_BACKEND_URL as string;
      const response = await fetch(`${BackendURL}/api/code/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token as string },
        body: JSON.stringify({
          language,
          version: LANGUAGE_VERSIONS[language as keyof ILanguagesVersion],
          code:sourceCode
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOutput({
          language,
          version: LANGUAGE_VERSIONS[language as keyof ILanguagesVersion],
          run: {
            code: 1,
            output: data?.msg || data?.error || "Code execution failed",
            stdout: "",
            stderr: data?.msg || data?.error || "Code execution failed",
          },
        });
        return data;
      }
      setOutput(data);
      return data;
    } catch (error) {
      setOutput({
        language,
        version: LANGUAGE_VERSIONS[language as keyof ILanguagesVersion],
        run: {
          code: 1,
          output: "Network error",
          stdout: "",
          stderr: "Network error",
        },
      });
      showPopup("Network error", "ERROR");
    } finally {
      setOutputLoading(false);
    }
  };

  // Conditional rendering

  if (userLoading) {
    console.log("User loading");
    return <Loading />;
  }
  if (!userData) return <NotLoggedIn />;
  if (existsRoom === false) return <SessionOver />;
  if (existsRoom === null) {
    console.log("exists loading");
    return <Loading />;
  }

  return (
    <>
      <RoomHeader
        title={roomData.roomTitle}
        password={roomData.roomPassword}
        onLeave={() => {
          if (roomData.hostSocketId === socket?.id) {
            navigate("/");
            window.location.reload();
            return;
          }
          navigate("/");
        }}
        roomID={roomID || ""}
        hostSocketId={roomData.hostSocketId}
      />
      <div className="dashboard-container">
        <section className="editor-section">
          <CodeEditor
            executeCode={executeCode}
            outputLoading={outputLoading}
            hostSocketId={roomData.hostSocketId}
            code={code}
            setCode={setCode}
          />
          <Output output={output} outputLoading={outputLoading} />
        </section>

        <aside className="sidebar">
          <Participants
            participantsData={participantData}
            hostSocketId={roomData.hostSocketId}
          />
          {/* <AISuggestions code={code} setCode={setCode} /> */}
        </aside>
      </div>
      <Chat participantsData={participantData} />
    </>
  );
};

export default Dashboard;
