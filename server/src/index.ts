import express, { Application, Request, Response } from "express";
import { connectDB } from "./db/connect";
import dotenv from "dotenv";
import { authRouter } from "./routes/authRouter";
import cors from "cors";
import { userRouter } from "./routes/userRouter";
import { loginValidator } from "./utils/loginValidator";
import { Server } from "socket.io";
import http from "http";
import { codeRouter } from "./routes/codeRouter";
import { dashboardRouter } from "./routes/dashboardRouter";
import { sessionModel } from "./models/sessionModel";

//config env varibale for accessing
dotenv.config();
//connect to the mongoDB
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for testing; replace with your frontend URL in production
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
  maxParticipants: number;
  lastCode: string;
  lastLanguage: string;
  participants: Participant[]; // socketId -> userName
};
let rooms = new Map<string, Room>();

const ROOM_TITLE_MIN_LENGTH = 3;
const ROOM_TITLE_MAX_LENGTH = 50;
const ROOM_PASSWORD_MIN_LENGTH = 4;
const ROOM_PASSWORD_MAX_LENGTH = 20;
const DEFAULT_CODE_SNIPPET = `function greet(name) {
\tconsole.log("Hello, " + name + "!");
}

greet("World");`;

const isWithinLength = (value: string, min: number, max: number) => {
  const length = value.trim().length;
  return length >= min && length <= max;
};
// Listen for socket connections
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  /********************** listen emit event from the client - create-room  ****************************/
  socket.on(
    "create-room",
    async ({ roomTitle, roomPassword, userData, hostUserId, maxParticipants = 5 }) => {
      if (
        !roomTitle ||
        !isWithinLength(roomTitle, ROOM_TITLE_MIN_LENGTH, ROOM_TITLE_MAX_LENGTH)
      ) {
        socket.emit("room-create-log", {
          msg: `Room title must be ${ROOM_TITLE_MIN_LENGTH}-${ROOM_TITLE_MAX_LENGTH} characters.`,
          type: "WARNING",
        });
        return;
      }

      if (
        !roomPassword ||
        !isWithinLength(roomPassword, ROOM_PASSWORD_MIN_LENGTH, ROOM_PASSWORD_MAX_LENGTH)
      ) {
        socket.emit("room-create-log", {
          msg: `Room password must be ${ROOM_PASSWORD_MIN_LENGTH}-${ROOM_PASSWORD_MAX_LENGTH} characters.`,
          type: "WARNING",
        });
        return;
      }

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
      const roomLimit = Math.min(Math.max(Number(maxParticipants) || 5, 1), 20);

      rooms.set(roomID, {
        roomID,
        roomTitle: roomTitle.trim(),
        roomPassword: roomPassword.trim(),
        hostUserId,
        hostSocketId: socket.id,
        maxParticipants: roomLimit,
        lastCode: DEFAULT_CODE_SNIPPET,
        lastLanguage: "javascript",
        participants: [],
      });
      await sessionModel.create({
        roomID,
        roomTitle: roomTitle.trim(),
        roomPassword: roomPassword.trim(),
        hostUserId,
        hostSocketId: socket.id,
        maxParticipants: roomLimit,
        lastCode: DEFAULT_CODE_SNIPPET,
        lastLanguage: "javascript",
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
  socket.on("join-room", async ({ roomID, roomPassword, userData }) => {
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

    if (room.participants.length >= room.maxParticipants) {
      socket.emit("join-room-error", {
        msg: "Room is full.",
        type: "ERROR",
      });
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
    await sessionModel.updateOne(
      { roomID },
      {
        $push: {
          participants: {
            userId: userData?._id,
            name: userData?.name,
            email: userData?.email,
            avatar: userData?.avatar,
            socketID: socket.id,
            role: room.hostSocketId === socket.id ? "HOST" : "GUEST",
          },
        },
        $set: {
          status: "ACTIVE",
          hostSocketId: room.hostSocketId,
        },
      }
    );

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

    if (room.participants.length >= room.maxParticipants) {
      socket.emit("join-room-check-valid", {
        msg: "Room is full.",
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
  socket.on("leave-room", async ({ roomID, userData }) => {
    const room = rooms.get(roomID);
    console.log("leave-room");
    if (!room) {
      socket.emit("room-error", { msg: "Room does not exist", type: "ERROR" });
      return;
    }

    //checking if the host leave the room then end the session
    if (room.hostSocketId === socket.id) {
      rooms.delete(roomID);
      await sessionModel.updateOne(
        { roomID },
        {
          $set: {
            status: "ENDED",
            endedAt: new Date(),
            "participants.$[participant].leftAt": new Date(),
          },
        },
        { arrayFilters: [{ "participant.socketID": socket.id }] }
      );
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
    await sessionModel.updateOne(
      { roomID, "participants.socketID": socket.id },
      {
        $set: {
          "participants.$.leftAt": new Date(),
        },
      }
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
  socket.on("remove-participant", async ({ roomId, participantSocketId }) => {
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
    await sessionModel.updateOne(
      { roomID: roomId, "participants.socketID": participantSocketId },
      {
        $set: {
          "participants.$.leftAt": new Date(),
        },
      }
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
  socket.on("code-update", async ({ updatedCode, roomID, editorName, language }) => {
    const room = rooms.get(roomID);

    if (!room) {
      socket.emit("join-room-error", {
        msg: "Room does not exist",
        type: "ERROR",
      });
      return;
    }

    room.lastCode = updatedCode;
    room.lastLanguage = language || room.lastLanguage || "javascript";
    rooms.set(roomID, room);
    await sessionModel.updateOne(
      { roomID },
      {
        $set: {
          lastCode: updatedCode,
          lastLanguage: room.lastLanguage,
          lastEditedBy: editorName,
          lastEditedAt: new Date(),
        },
      }
    );

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

// Default route
app.use("/api/auth", authRouter);
// Temporarily disabled for local API testing in Postman.
// Re-enable this before production or protected-route testing.
// app.use(loginValidator);
app.use(loginValidator);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/code", codeRouter);
app.use("/api/user", userRouter);

// Start server
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
