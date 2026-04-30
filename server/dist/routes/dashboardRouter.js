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
exports.dashboardRouter = void 0;
const express_1 = __importDefault(require("express"));
const sessionModel_1 = require("../models/sessionModel");
exports.dashboardRouter = express_1.default.Router();
exports.dashboardRouter.get("/sessions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userID = req.userID;
        const sessions = yield sessionModel_1.sessionModel
            .find({ hostUserId: userID })
            .sort({ updatedAt: -1 })
            .limit(12)
            .lean();
        const recentMembersMap = new Map();
        sessions.forEach((session) => {
            var _a;
            (_a = session.participants) === null || _a === void 0 ? void 0 : _a.forEach((participant) => {
                var _a;
                const id = ((_a = participant.userId) === null || _a === void 0 ? void 0 : _a.toString()) || participant.email || participant.socketID;
                if (!id || id === (userID === null || userID === void 0 ? void 0 : userID.toString())) {
                    return;
                }
                if (!recentMembersMap.has(id)) {
                    recentMembersMap.set(id, {
                        userId: participant.userId,
                        name: participant.name,
                        email: participant.email,
                        avatar: participant.avatar,
                        lastSessionTitle: session.roomTitle,
                        lastJoinedAt: participant.joinedAt,
                    });
                }
            });
        });
        return res.status(200).json({
            msg: "Dashboard sessions fetched",
            type: "SUCCESS",
            sessions,
            recentMembers: Array.from(recentMembersMap.values()).slice(0, 8),
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Unable to fetch dashboard sessions",
            type: "ERROR",
        });
    }
}));
exports.dashboardRouter.get("/sessions/:roomID", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userID = req.userID;
        const { roomID } = req.params;
        const session = yield sessionModel_1.sessionModel.findOne({ roomID }).lean();
        if (!session) {
            return res.status(404).json({
                msg: "Room session not found",
                type: "ERROR",
            });
        }
        const isHost = ((_a = session.hostUserId) === null || _a === void 0 ? void 0 : _a.toString()) === (userID === null || userID === void 0 ? void 0 : userID.toString());
        const isParticipant = (_b = session.participants) === null || _b === void 0 ? void 0 : _b.some((participant) => { var _a; return ((_a = participant.userId) === null || _a === void 0 ? void 0 : _a.toString()) === (userID === null || userID === void 0 ? void 0 : userID.toString()); });
        if (!isHost && !isParticipant) {
            return res.status(403).json({
                msg: "You do not have access to this room history",
                type: "ERROR",
            });
        }
        return res.status(200).json({
            msg: "Room session fetched",
            type: "SUCCESS",
            session,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Unable to fetch room session",
            type: "ERROR",
        });
    }
}));
