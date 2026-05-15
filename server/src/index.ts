import express, { Application } from "express";
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
import { registerRoomHandlers } from "./socket/registerRoomHandlers";
import { profileRouter } from "./routes/profileRouter";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
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
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerRoomHandlers(io);

app.use("/api/auth", authRouter);
app.use(loginValidator);
app.use("/api/profile", profileRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/code", codeRouter);
app.use("/api/user", userRouter);

server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
