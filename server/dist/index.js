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
const registerRoomHandlers_1 = require("./socket/registerRoomHandlers");
const profileRouter_1 = require("./routes/profileRouter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use(express_1.default.json({ limit: "15mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "15mb" }));
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
(0, registerRoomHandlers_1.registerRoomHandlers)(io);
app.use("/api/auth", authRouter_1.authRouter);
app.use(loginValidator_1.loginValidator);
app.use("/api/profile", profileRouter_1.profileRouter);
app.use("/api/dashboard", dashboardRouter_1.dashboardRouter);
app.use("/api/code", codeRouter_1.codeRouter);
app.use("/api/user", userRouter_1.userRouter);
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, connect_1.connectDB)();
    console.log(`Server running on http://localhost:${PORT}`);
}));
