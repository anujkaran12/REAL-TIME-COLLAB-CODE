import express from "express";
import { sessionModel } from "../models/sessionModel";
import { AuthenticatedRequest, Response } from "../types";

export const dashboardRouter = express.Router();

dashboardRouter.get("/sessions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userID = req.userID;

    const sessions = await sessionModel
      .find({ hostUserId: userID })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean();

    const recentMembersMap = new Map<string, any>();

    sessions.forEach((session: any) => {
      session.participants?.forEach((participant: any) => {
        const id = participant.userId?.toString() || participant.email || participant.socketID;
        if (!id || id === userID?.toString()) {
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Unable to fetch dashboard sessions",
      type: "ERROR",
    });
  }
});

dashboardRouter.get(
  "/sessions/:roomID",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userID = req.userID;
      const { roomID } = req.params;

      const session = await sessionModel.findOne({ roomID }).lean();

      if (!session) {
        return res.status(404).json({
          msg: "Room session not found",
          type: "ERROR",
        });
      }

      const isHost = session.hostUserId?.toString() === userID?.toString();
      const isParticipant = session.participants?.some(
        (participant: any) => participant.userId?.toString() === userID?.toString()
      );

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
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        msg: "Unable to fetch room session",
        type: "ERROR",
      });
    }
  }
);
