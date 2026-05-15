import { Server, Socket } from "socket.io";
import { sessionModel } from "../models/sessionModel";
import {
  DEFAULT_CODE_SNIPPET,
  ROOM_PASSWORD_MAX_LENGTH,
  ROOM_PASSWORD_MIN_LENGTH,
  ROOM_TITLE_MAX_LENGTH,
  ROOM_TITLE_MIN_LENGTH,
} from "./constants";
import { createRoomID, deleteRoom, getRoom, rooms, saveRoom } from "./roomStore";
import { Participant, Room } from "./types";
import { isWithinLength } from "./validators";

const emitRoomError = (socket: Socket, event: string, msg: string) => {
  socket.emit(event, { msg, type: "ERROR" });
};

const endRoomSession = async (io: Server, room: Room) => {
  const endedAt = new Date();

  deleteRoom(room.roomID);

  await sessionModel.updateOne(
    { roomID: room.roomID },
    {
      $set: {
        status: "ENDED",
        endedAt,
        "participants.$[].leftAt": endedAt,
      },
    }
  );

  io.to(room.roomID).emit("end-session", {
    msg: `Host ended the session for room "${room.roomTitle}"`,
    type: "INFO",
  });
  io.in(room.roomID).socketsLeave(room.roomID);
};

const handleCreateRoom = (socket: Socket) => {
  socket.on(
    "create-room",
    async ({ roomTitle, roomPassword, userData, hostUserId, maxParticipants = 6 }) => {
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

      const roomID = createRoomID();
      const roomLimit = Math.min(Math.max(Number(maxParticipants) || 6, 2), 21);
      const room: Room = {
        roomID,
        roomTitle: roomTitle.trim(),
        roomPassword: roomPassword.trim(),
        hostUserId,
        hostSocketId: socket.id,
        maxParticipants: roomLimit,
        lastCode: DEFAULT_CODE_SNIPPET,
        lastLanguage: "javascript",
        participants: [],
      };

      socket.join(roomID);
      saveRoom(room);

      await sessionModel.create(room);

      socket.emit("room-create-log", {
        msg: `Room "${roomTitle}" created successfully.`,
        type: "SUCCESS",
        data: room,
      });
    }
  );
};

const handleJoinRoom = (io: Server, socket: Socket) => {
  socket.on("join-room", async ({ roomID, roomPassword, userData }) => {
    const room = getRoom(roomID);

    if (!room) {
      emitRoomError(socket, "join-room-error", "Room does not exist.");
      return;
    }

    if (room.roomPassword && room.roomPassword !== roomPassword) {
      emitRoomError(socket, "join-room-error", "Incorrect password.");
      return;
    }

    if (
      room.hostUserId &&
      userData?._id &&
      String(room.hostUserId) === String(userData._id) &&
      room.hostSocketId !== socket.id
    ) {
      await endRoomSession(io, room);
      emitRoomError(socket, "join-room-error", "Host left the session.");
      return;
    }

    const userExistsInRoom = room.participants.some(
      (participant) => participant.socketID === socket.id
    );

    if (userExistsInRoom) {
      return;
    }

    if (room.participants.length >= room.maxParticipants) {
      emitRoomError(socket, "join-room-error", "Room is full.");
      return;
    }

    socket.join(roomID);

    room.participants.push({
      socketID: socket.id,
      userData,
      role: room.hostSocketId === socket.id ? "HOST" : "GUEST",
    });
    saveRoom(room);

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
    });
  });
};

const handleCheckRoom = (socket: Socket) => {
  socket.on("check-room", ({ roomID, roomPassword }) => {
    const room = getRoom(roomID);

    if (!room) {
      emitRoomError(socket, "join-room-check-valid", "Room does not exist.");
      return;
    }

    if (room.roomPassword !== roomPassword) {
      emitRoomError(socket, "join-room-check-valid", "Incorrect Password.");
      return;
    }

    if (room.participants.length >= room.maxParticipants) {
      emitRoomError(socket, "join-room-check-valid", "Room is full.");
      return;
    }

    socket.emit("join-room-check-valid", {
      msg: "Room found and accessible.",
      roomID,
      roomPassword,
      type: "SUCCESS",
    });
  });
};

const handleLeaveRoom = (io: Server, socket: Socket) => {
  socket.on("leave-room", async ({ roomID, userData }) => {
    const room = getRoom(roomID);

    if (!room) {
      emitRoomError(socket, "room-error", "Room does not exist");
      return;
    }

    if (room.hostSocketId === socket.id) {
      await endRoomSession(io, room);
      return;
    }

    room.participants = room.participants.filter(
      (participant: Participant) => participant.socketID !== socket.id
    );

    await sessionModel.updateOne(
      { roomID, "participants.socketID": socket.id },
      {
        $set: {
          "participants.$.leftAt": new Date(),
        },
      }
    );

    saveRoom(room);

    socket.to(roomID).emit("participant-left", {
      socketID: socket.id,
      msg: `${userData?.name} has left the session.`,
      type: "INFO",
      data: room,
    });

    socket.emit("left-room", {
      msg: `You have left the session "${room.roomTitle}"`,
      type: "SUCCESS",
    });
    socket.leave(roomID);

    if (room.participants.length === 0) {
      deleteRoom(roomID);
    }
  });
};

const handleRemoveParticipant = (io: Server, socket: Socket) => {
  socket.on("remove-participant", async ({ roomId, participantSocketId }) => {
    const room = getRoom(roomId);

    if (!room) {
      emitRoomError(socket, "join-room-error", "Room does not exist");
      return;
    }

    const participantData = room.participants.filter(
      (participant) => participant.socketID === participantSocketId
    );
    room.participants = room.participants.filter(
      (participant) => participant.socketID !== participantSocketId
    );
    saveRoom(room);

    await sessionModel.updateOne(
      { roomID: roomId, "participants.socketID": participantSocketId },
      {
        $set: {
          "participants.$.leftAt": new Date(),
        },
      }
    );

    io.to(roomId).emit("participant-removed", {
      msg: `${participantData[0]?.userData?.name || "Participant"} removed by the host`,
      data: room,
      type: "WARNING",
    });

    const participantSocket = io.sockets.sockets.get(participantSocketId);
    if (participantSocket) {
      participantSocket.leave(roomId);
      participantSocket.emit("removed-from-room", {
        msg: `You were removed from "${room.roomTitle}" by the host`,
        type: "ERROR",
      });
    }
  });
};

const handleCodeUpdate = (socket: Socket) => {
  socket.on("code-update", async ({ updatedCode, roomID, editorName, language }) => {
    const room = getRoom(roomID);

    if (!room) {
      emitRoomError(socket, "join-room-error", "Room does not exist");
      return;
    }

    room.lastCode = updatedCode;
    room.lastLanguage = language || room.lastLanguage || "javascript";
    saveRoom(room);

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
};

const handleChat = (socket: Socket) => {
  socket.on("send-msg", (roomID, msg) => {
    const room = getRoom(roomID);

    if (!room) {
      emitRoomError(socket, "join-room-error", "Room does not exist");
      return;
    }

    socket.to(roomID).emit("receive-msg", msg);
  });

  socket.on("typing", ({ roomID, name }) => {
    socket.to(roomID).emit("typing", {
      socketID: socket.id,
      name,
    });
  });
};

const handleDisconnect = (io: Server, socket: Socket) => {
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);

    const room = [...rooms.values()].find(
      (room) =>
        room.hostSocketId === socket.id ||
        room.participants.some(
          (participant) => participant.socketID === socket.id
        )
    );

    if (!room) {
      return;
    }

    if (room.hostSocketId === socket.id) {
      await endRoomSession(io, room);
      return;
    }

    const leavingParticipant = room.participants.find(
      (participant) => participant.socketID === socket.id
    );
    room.participants = room.participants.filter(
      (participant) => participant.socketID !== socket.id
    );

    await sessionModel.updateOne(
      { roomID: room.roomID, "participants.socketID": socket.id },
      {
        $set: {
          "participants.$.leftAt": new Date(),
        },
      }
    );

    if (room.participants.length === 0) {
      deleteRoom(room.roomID);
      return;
    }

    saveRoom(room);

    socket.to(room.roomID).emit("participant-left", {
      socketID: socket.id,
      msg: `${leavingParticipant?.userData?.name || "Participant"} has left the session.`,
      type: "INFO",
      data: room,
    });
  });
};

export const registerRoomHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);

    handleCreateRoom(socket);
    handleJoinRoom(io, socket);
    handleCheckRoom(socket);
    handleLeaveRoom(io, socket);
    handleRemoveParticipant(io, socket);
    handleCodeUpdate(socket);
    handleChat(socket);
    handleDisconnect(io, socket);
  });
};
