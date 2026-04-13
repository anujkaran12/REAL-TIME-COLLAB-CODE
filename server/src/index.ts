import express, { Application, Request, Response } from "express";
import { connectDB } from "./db/connect";
import dotenv from "dotenv";
import { authRouter } from "./routes/authRouter";
import cors from "cors";
import { userRouter } from "./routes/userRouter";
import { loginValidator } from "./utils/loginValidator";
import { aiRouter } from "./routes/aiRouter";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from "http";

//config env varibale for accessing
dotenv.config();
//connect to the mongoDB
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});
type Participant = {
  socketID: string;
  role: string;
  userData: any;
};
type Room = {
  roomID: string;
  roomTitle?: string;
  roomPassword?: string;
  hostUserId?: string;
  hostSocketId?: string;
  participants: Participant[]; // socketId -> userName
};
let rooms = new Map<string, Room>();
// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY as string);
    (socket as any).userID = decoded;
    next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
});

// Listen for socket connections
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  /********************** listen emit event from the client - create-room  ****************************/
  socket.on(
    "create-room",
    ({ roomTitle, roomPassword, userData, hostUserId }) => {
      let roomID: string = "";
      console.log("CREATE ROOM TRIGGER");
      while (1) {
        roomID = (
          Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000
        ).toString();
        if (!rooms.get(roomID)) {
          break;
        }
      }

      socket.join(roomID);

      rooms.set(roomID, {
        roomID,
        roomTitle,
        roomPassword,
        hostUserId,
        hostSocketId: socket.id,
        participants: [],
      });
      // console.log("Room - ", rooms.get(roomID));

      socket.emit("room-create-log", {
        msg: `Room "${roomTitle}" created successfully.`,
        type: "SUCCESS",
        data: rooms.get(roomID),
      });
    }
  );

  /********************** listen emit event from the client - join-room  ****************************/
  socket.on("join-room", ({ roomID, roomPassword, userData }) => {
    const room = rooms.get(roomID);

    if (!room) {
      socket.emit("join-room-error", {
        msg: "Room does not exist.",
        type: "ERROR",
      });
      return;
    }

    if (room.roomPassword && room.roomPassword != roomPassword) {
      socket.emit("join-room-error", {
        msg: "Incorrect password.",
        type: "ERROR",
      });
      return;
    }

    // checking if the user was already in the room
    const userExistsInRoom = room?.participants.some(
      (p) => p.socketID === socket.id
    );

    if (userExistsInRoom) {
      return;
    }
    console.log("JOIN ROOM - ", roomID);

    socket.join(roomID);

    room.participants.push({
      socketID: socket.id,
      userData,
      role: room.hostSocketId === socket.id ? "HOST" : "GUEST",
    });
    rooms.set(roomID, room);

    socket.emit("join-room-success", {
      msg:
        room.hostSocketId === socket.id
          ? "You are the HOST of this session."
          : `Joined room "${room.roomTitle}" successfully.`,
      type: room.hostSocketId === socket.id ? "INFO" : "SUCCESS",
      data: room,
    });

    socket.to(roomID).emit("user-joined", {
      msg: `${userData.name} has joined the session`,
      type: "INFO",
      data: room,
    }); // notify others in room
  });

  /***********************************   checking room valid or not **********************************/
  socket.on("check-room", ({ roomID, roomPassword }) => {
    const room = rooms.get(roomID);

    if (!room) {
      socket.emit("join-room-check-valid", {
        msg: "Room does not exist.",
        type: "ERROR",
      });
      return;
    }
    if (room.roomPassword !== roomPassword) {
      socket.emit("join-room-check-valid", {
        msg: "Incorrect Password.",
        type: "ERROR",
      });
      return;
    }

    socket.emit("join-room-check-valid", {
      msg: "Room found and accessible.",
      roomID,
      roomPassword,
      type: "SUCCESS",
    });
  });

  /***********************************  listen emit event from the client - leave-room  **********************************/
  socket.on("leave-room", ({ roomID, userData }) => {
    const room = rooms.get(roomID);
    console.log("leave-room");
    if (!room) {
      socket.emit("room-error", { msg: "Room does not exist", type: "ERROR" });
      return;
    }

    //checking if the host leave the room then end the session
    if (room.hostSocketId === socket.id) {
      rooms.delete(roomID);
      socket.to(roomID).emit("end-session", {
        msg: `Host ended the session for room "${room.roomTitle}`,
        type: "INFO",
      });
      console.log("session-ended");
      return;
    }

    // Remove the leaving participant from the participants array
    room.participants = room.participants.filter(
      (p: Participant) => p.socketID !== socket.id
    );

    // Update the room map
    rooms.set(roomID, room);
    console.log("participant length:  ", room.participants.length);

    // Notify remaining participants that someone left
    socket.to(roomID).emit("participant-left", {
      socketID: socket.id,
      msg: `${userData?.name} has left the session.`,
      type: "INFO",
      data: rooms.get(roomID),
    });


    // Confirm to the leaving participant
    socket.emit("left-room", {
      msg: `You have left the session "${room.roomTitle}`,
      type: "SUCCESS",
    });
    socket.leave(roomID);

    // Optional: delete room if empty
    if (room.participants.length === 0) {
      rooms.delete(roomID);
    }
  });
  /***************************************** Remove participant from room **************************************/
  socket.on("remove-participant", ({ roomId, participantSocketId }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit("join-room-error", {
        msg: "Room does not exist",
        type: "ERROR",
      });
      return;
    }

    const participantData = room.participants.filter(
      (p) => p.socketID === participantSocketId
    );
    room.participants = room.participants.filter(
      (p) => p.socketID !== participantSocketId
    );

    io.to(roomId).emit("participant-removed", {
      msg: `${participantData[0].userData.name} removed by the host`,
      data: rooms.get(roomId),
      type: "WARNING",
    });
    // / Get the actual participant socket
    const participantSocket = io.sockets.sockets.get(participantSocketId);
    if (participantSocket) {
      // Remove participant from the room
      participantSocket.leave(roomId);

      // Notify the participant themselves
      participantSocket.emit("removed-from-room", {
        msg: `You were removed from "${room.roomTitle}" by the host`,
        type: "ERROR",
      });
    }
  });
  /*************************************** Listining on code update *****************************************/
  socket.on("code-update", ({ updatedCode, roomID, editorName }) => {
    const room = rooms.get(roomID);

    if (!room) {
      socket.emit("join-room-error", {
        msg: "Room does not exist",
        type: "ERROR",
      });
      return;
    }

    socket.to(roomID).emit("code-update", { updatedCode, editorName });
  });
  
  /*************************************** Listining on send message *****************************************/
  socket.on("send-msg",(roomID,msg)=>{
     const room = rooms.get(roomID);

    if (!room) {
      socket.emit("join-room-error", {
        msg: "Room does not exist",
        type: "ERROR",
      });
      return;
    }
    socket.to(roomID).emit("receive-msg",msg);
  })

   socket.on("typing",({roomID,name})=>{
    socket.to(roomID).emit("typing",name)
   })





  /*************************************** Listining on disconnect *****************************************/
  socket.on("disconnect", (roomID) => {
    // if(socket.id ==)
    const room = rooms.get(roomID);
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use(loginValidator);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);

// Start server
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
