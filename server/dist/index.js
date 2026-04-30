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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connect_1 = require("./db/connect");
const dotenv_1 = __importDefault(require("dotenv"));
const authRouter_1 = require("./routes/authRouter");
const cors_1 = __importDefault(require("cors"));
const userRouter_1 = require("./routes/userRouter");
const loginValidator_1 = require("./utils/loginValidator");
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const codeRouter_1 = require("./routes/codeRouter");
const dashboardRouter_1 = require("./routes/dashboardRouter");
const sessionModel_1 = require("./models/sessionModel");
//config env varibale for accessing
dotenv_1.default.config();
//connect to the mongoDB
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // allow all origins for testing; replace with your frontend URL in production
        methods: ["GET", "POST"],
    },
});
let rooms = new Map();
const ROOM_TITLE_MIN_LENGTH = 3;
const ROOM_TITLE_MAX_LENGTH = 50;
const ROOM_PASSWORD_MIN_LENGTH = 4;
const ROOM_PASSWORD_MAX_LENGTH = 20;
const DEFAULT_CODE_SNIPPET = `function greet(name) {
\tconsole.log("Hello, " + name + "!");
}

greet("World");`;
const isWithinLength = (value, min, max) => {
    const length = value.trim().length;
    return length >= min && length <= max;
};
// Listen for socket connections
io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);
    /********************** listen emit event from the client - create-room  ****************************/
    socket.on("create-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomTitle, roomPassword, userData, hostUserId, maxParticipants = 5 }) {
        if (!roomTitle ||
            !isWithinLength(roomTitle, ROOM_TITLE_MIN_LENGTH, ROOM_TITLE_MAX_LENGTH)) {
            socket.emit("room-create-log", {
                msg: `Room title must be ${ROOM_TITLE_MIN_LENGTH}-${ROOM_TITLE_MAX_LENGTH} characters.`,
                type: "WARNING",
            });
            return;
        }
        if (!roomPassword ||
            !isWithinLength(roomPassword, ROOM_PASSWORD_MIN_LENGTH, ROOM_PASSWORD_MAX_LENGTH)) {
            socket.emit("room-create-log", {
                msg: `Room password must be ${ROOM_PASSWORD_MIN_LENGTH}-${ROOM_PASSWORD_MAX_LENGTH} characters.`,
                type: "WARNING",
            });
            return;
        }
        let roomID = "";
        console.log("CREATE ROOM TRIGGER");
        while (1) {
            roomID = (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000).toString();
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
        yield sessionModel_1.sessionModel.create({
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
    }));
    /********************** listen emit event from the client - join-room  ****************************/
    socket.on("join-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomID, roomPassword, userData }) {
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
        const userExistsInRoom = room === null || room === void 0 ? void 0 : room.participants.some((p) => p.socketID === socket.id);
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
        }); // notify others in room
    }));
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
    socket.on("leave-room", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomID, userData }) {
        const room = rooms.get(roomID);
        console.log("leave-room");
        if (!room) {
            socket.emit("room-error", { msg: "Room does not exist", type: "ERROR" });
            return;
        }
        //checking if the host leave the room then end the session
        if (room.hostSocketId === socket.id) {
            rooms.delete(roomID);
            yield sessionModel_1.sessionModel.updateOne({ roomID }, {
                $set: {
                    status: "ENDED",
                    endedAt: new Date(),
                    "participants.$[participant].leftAt": new Date(),
                },
            }, { arrayFilters: [{ "participant.socketID": socket.id }] });
            socket.to(roomID).emit("end-session", {
                msg: `Host ended the session for room "${room.roomTitle}`,
                type: "INFO",
            });
            console.log("session-ended");
            return;
        }
        // Remove the leaving participant from the participants array
        room.participants = room.participants.filter((p) => p.socketID !== socket.id);
        yield sessionModel_1.sessionModel.updateOne({ roomID, "participants.socketID": socket.id }, {
            $set: {
                "participants.$.leftAt": new Date(),
            },
        });
        // Update the room map
        rooms.set(roomID, room);
        console.log("participant length:  ", room.participants.length);
        // Notify remaining participants that someone left
        socket.to(roomID).emit("participant-left", {
            socketID: socket.id,
            msg: `${userData === null || userData === void 0 ? void 0 : userData.name} has left the session.`,
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
    }));
    /***************************************** Remove participant from room **************************************/
    socket.on("remove-participant", (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomId, participantSocketId }) {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit("join-room-error", {
                msg: "Room does not exist",
                type: "ERROR",
            });
            return;
        }
        const participantData = room.participants.filter((p) => p.socketID === participantSocketId);
        room.participants = room.participants.filter((p) => p.socketID !== participantSocketId);
        yield sessionModel_1.sessionModel.updateOne({ roomID: roomId, "participants.socketID": participantSocketId }, {
            $set: {
                "participants.$.leftAt": new Date(),
            },
        });
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
    }));
    /*************************************** Listining on code update *****************************************/
    socket.on("code-update", (_a) => __awaiter(void 0, [_a], void 0, function* ({ updatedCode, roomID, editorName, language }) {
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
    /*************************************** Listening on cursor update *****************************************/
    socket.on("cursor-update", ({ roomID, position, userData, color }) => {
        const room = rooms.get(roomID);
        if (!room) {
            return;
        }
        socket.to(roomID).emit("cursor-update", {
            socketID: socket.id,
            position,
            userData,
            color,
        });
    });
    /*************************************** Listining on send message *****************************************/
    socket.on("send-msg", (roomID, msg) => {
        const room = rooms.get(roomID);
        if (!room) {
            socket.emit("join-room-error", {
                msg: "Room does not exist",
                type: "ERROR",
            });
            return;
        }
        socket.to(roomID).emit("receive-msg", msg);
    });
    socket.on("typing", ({ roomID, name }) => {
        socket.to(roomID).emit("typing", name);
    });
    /*************************************** Listining on disconnect *****************************************/
    socket.on("disconnect", (roomID) => {
        // if(socket.id ==)
        const room = rooms.get(roomID);
        console.log("Client disconnected:", socket.id);
    });
});
// Default route
app.use("/api/auth", authRouter_1.authRouter);
// Temporarily disabled for local API testing in Postman.
// Re-enable this before production or protected-route testing.
// app.use(loginValidator);
app.use("/api/dashboard", loginValidator_1.loginValidator, dashboardRouter_1.dashboardRouter);
app.use("/api/code", codeRouter_1.codeRouter);
app.use(loginValidator_1.loginValidator);
app.use("/api/user", userRouter_1.userRouter);
// Start server
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, connect_1.connectDB)();
    console.log(`Server running on http://localhost:${PORT}`);
}));
