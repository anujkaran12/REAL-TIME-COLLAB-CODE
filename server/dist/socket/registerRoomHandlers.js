"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoomHandlers = void 0;
const sessionModel_1 = require("../models/sessionModel");
const constants_1 = require("./constants");
const roomStore_1 = require("./roomStore");
const validators_1 = require("./validators");
const emitRoomError = (socket, event, msg) => {
    socket.emit(event, { msg, type: "ERROR" });
};
const endRoomSession = (io, room) => __awaiter(void 0, void 0, void 0, function* () {
    const endedAt = new Date();
    (0, roomStore_1.deleteRoom)(room.roomID);
    yield sessionModel_1.sessionModel.updateOne({ roomID: room.roomID }, {
        $set: {
            status: "ENDED",
            endedAt,
            "participants.$[].leftAt": endedAt,
        },
    });
    io.to(room.roomID).emit("end-session", {
        msg: `Host ended the session for room "${room.roomTitle}"`,
        type: "INFO",
    });
    io.in(room.roomID).socketsLeave(room.roomID);
});
const handleCreateRoom = (socket) => {
    socket.on("create-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomTitle, roomPassword, userData, hostUserId, maxParticipants = 6 }) {
        if (!roomTitle ||
            !(0, validators_1.isWithinLength)(roomTitle, constants_1.ROOM_TITLE_MIN_LENGTH, constants_1.ROOM_TITLE_MAX_LENGTH)) {
            socket.emit("room-create-log", {
                msg: `Room title must be ${constants_1.ROOM_TITLE_MIN_LENGTH}-${constants_1.ROOM_TITLE_MAX_LENGTH} characters.`,
                type: "WARNING",
            });
            return;
        }
        if (!roomPassword ||
            !(0, validators_1.isWithinLength)(roomPassword, constants_1.ROOM_PASSWORD_MIN_LENGTH, constants_1.ROOM_PASSWORD_MAX_LENGTH)) {
            socket.emit("room-create-log", {
                msg: `Room password must be ${constants_1.ROOM_PASSWORD_MIN_LENGTH}-${constants_1.ROOM_PASSWORD_MAX_LENGTH} characters.`,
                type: "WARNING",
            });
            return;
        }
        const roomID = (0, roomStore_1.createRoomID)();
        const roomLimit = Math.min(Math.max(Number(maxParticipants) || 6, 2), 21);
        const room = {
            roomID,
            roomTitle: roomTitle.trim(),
            roomPassword: roomPassword.trim(),
            hostUserId,
            hostSocketId: socket.id,
            maxParticipants: roomLimit,
            lastCode: constants_1.DEFAULT_CODE_SNIPPET,
            lastLanguage: "javascript",
            participants: [],
        };
        socket.join(roomID);
        (0, roomStore_1.saveRoom)(room);
        yield sessionModel_1.sessionModel.create(room);
        socket.emit("room-create-log", {
            msg: `Room "${roomTitle}" created successfully.`,
            type: "SUCCESS",
            data: room,
        });
    }));
};
const handleJoinRoom = (io, socket) => {
    socket.on("join-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomID, roomPassword, userData }) {
        const room = (0, roomStore_1.getRoom)(roomID);
        if (!room) {
            emitRoomError(socket, "join-room-error", "Room does not exist.");
            return;
        }
        if (room.roomPassword && room.roomPassword !== roomPassword) {
            emitRoomError(socket, "join-room-error", "Incorrect password.");
            return;
        }
        if (room.hostUserId &&
            (userData === null || userData === void 0 ? void 0 : userData._id) &&
            String(room.hostUserId) === String(userData._id) &&
            room.hostSocketId !== socket.id) {
            yield endRoomSession(io, room);
            emitRoomError(socket, "join-room-error", "Host left the session.");
            return;
        }
        const userExistsInRoom = room.participants.some((participant) => participant.socketID === socket.id);
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
        (0, roomStore_1.saveRoom)(room);
        yield sessionModel_1.sessionModel.updateOne({ roomID }, {
            $push: {
                participants: {
                    userId: userData === null || userData === void 0 ? void 0 : userData._id,
                    name: userData === null || userData === void 0 ? void 0 : userData.name,
                    email: userData === null || userData === void 0 ? void 0 : userData.email,
                    avatar: userData === null || userData === void 0 ? void 0 : userData.avatar,
                    socketID: socket.id,
                    role: room.hostSocketId === socket.id ? "HOST" : "GUEST",
                },
            },
            $set: {
                status: "ACTIVE",
                hostSocketId: room.hostSocketId,
            },
        });
        socket.emit("join-room-success", {
            msg: room.hostSocketId === socket.id
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
    }));
};
const handleCheckRoom = (socket) => {
    socket.on("check-room", ({ roomID, roomPassword }) => {
        const room = (0, roomStore_1.getRoom)(roomID);
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
const handleLeaveRoom = (io, socket) => {
    socket.on("leave-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomID, userData }) {
        const room = (0, roomStore_1.getRoom)(roomID);
        if (!room) {
            emitRoomError(socket, "room-error", "Room does not exist");
            return;
        }
        if (room.hostSocketId === socket.id) {
            yield endRoomSession(io, room);
            return;
        }
        room.participants = room.participants.filter((participant) => participant.socketID !== socket.id);
        yield sessionModel_1.sessionModel.updateOne({ roomID, "participants.socketID": socket.id }, {
            $set: {
                "participants.$.leftAt": new Date(),
            },
        });
        (0, roomStore_1.saveRoom)(room);
        socket.to(roomID).emit("participant-left", {
            socketID: socket.id,
            msg: `${userData === null || userData === void 0 ? void 0 : userData.name} has left the session.`,
            type: "INFO",
            data: room,
        });
        socket.emit("left-room", {
            msg: `You have left the session "${room.roomTitle}"`,
            type: "SUCCESS",
        });
        socket.leave(roomID);
        if (room.participants.length === 0) {
            (0, roomStore_1.deleteRoom)(roomID);
        }
    }));
};
const handleRemoveParticipant = (io, socket) => {
    socket.on("remove-participant", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, participantSocketId }) {
        var _b, _c;
        const room = (0, roomStore_1.getRoom)(roomId);
        if (!room) {
            emitRoomError(socket, "join-room-error", "Room does not exist");
            return;
        }
        const participantData = room.participants.filter((participant) => participant.socketID === participantSocketId);
        room.participants = room.participants.filter((participant) => participant.socketID !== participantSocketId);
        (0, roomStore_1.saveRoom)(room);
        yield sessionModel_1.sessionModel.updateOne({ roomID: roomId, "participants.socketID": participantSocketId }, {
            $set: {
                "participants.$.leftAt": new Date(),
            },
        });
        io.to(roomId).emit("participant-removed", {
            msg: `${((_c = (_b = participantData[0]) === null || _b === void 0 ? void 0 : _b.userData) === null || _c === void 0 ? void 0 : _c.name) || "Participant"} removed by the host`,
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
    }));
};
const handleCodeUpdate = (socket) => {
    socket.on("code-update", (_a) => __awaiter(void 0, [_a], void 0, function* ({ updatedCode, roomID, editorName, language }) {
        const room = (0, roomStore_1.getRoom)(roomID);
        if (!room) {
            emitRoomError(socket, "join-room-error", "Room does not exist");
            return;
        }
        room.lastCode = updatedCode;
        room.lastLanguage = language || room.lastLanguage || "javascript";
        (0, roomStore_1.saveRoom)(room);
        yield sessionModel_1.sessionModel.updateOne({ roomID }, {
            $set: {
                lastCode: updatedCode,
                lastLanguage: room.lastLanguage,
                lastEditedBy: editorName,
                lastEditedAt: new Date(),
            },
        });
        socket.to(roomID).emit("code-update", { updatedCode, editorName });
    }));
};
const handleChat = (socket) => {
    socket.on("send-msg", (roomID, msg) => {
        const room = (0, roomStore_1.getRoom)(roomID);
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
const handleDisconnect = (io, socket) => {
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        console.log("Client disconnected:", socket.id);
        const room = [...roomStore_1.rooms.values()].find((room) => room.hostSocketId === socket.id ||
            room.participants.some((participant) => participant.socketID === socket.id));
        if (!room) {
            return;
        }
        if (room.hostSocketId === socket.id) {
            yield endRoomSession(io, room);
            return;
        }
        const leavingParticipant = room.participants.find((participant) => participant.socketID === socket.id);
        room.participants = room.participants.filter((participant) => participant.socketID !== socket.id);
        yield sessionModel_1.sessionModel.updateOne({ roomID: room.roomID, "participants.socketID": socket.id }, {
            $set: {
                "participants.$.leftAt": new Date(),
            },
        });
        if (room.participants.length === 0) {
            (0, roomStore_1.deleteRoom)(room.roomID);
            return;
        }
        (0, roomStore_1.saveRoom)(room);
        socket.to(room.roomID).emit("participant-left", {
            socketID: socket.id,
            msg: `${((_a = leavingParticipant === null || leavingParticipant === void 0 ? void 0 : leavingParticipant.userData) === null || _a === void 0 ? void 0 : _a.name) || "Participant"} has left the session.`,
            type: "INFO",
            data: room,
        });
    }));
};
const registerRoomHandlers = (io) => {
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
exports.registerRoomHandlers = registerRoomHandlers;
