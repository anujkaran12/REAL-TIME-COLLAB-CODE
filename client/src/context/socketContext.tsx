// socketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../redux/store";
import { usePopup } from "./popupContext";


type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { showPopup } = usePopup();

  const { userData } = useSelector((state: RootState) => state.User);
  useEffect(() => {
    if (!userData) {
      setSocket(null);
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) {
      showPopup("Backend URL is not configured", "ERROR");
      return;
    }

    const webSocket = io(backendUrl, {
      autoConnect: true,
    });
    setSocket(webSocket);

    webSocket.on("connect", () => {
      console.log("Connected to server:", webSocket.id);
    });

    webSocket.on("disconnect", () => {
      console.log("Disconnected from server SOCKET CONTEXT");
    });

    webSocket.on("left-room", ({ msg, type }) => {
      showPopup(msg, type);
    });

    return () => {
      webSocket.disconnect();
      setSocket(null);
    };
  }, [userData, showPopup]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context.socket;
};
