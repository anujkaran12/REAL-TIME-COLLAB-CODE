import express from "express";
import multer from "multer";
import { getProfile, updateProfile } from "../controller/profileController";
import { uploadAvatar } from "../middleware/uploadAvatar";
import { NextFunction, Request, Response } from "../types";

export const profileRouter = express.Router();

profileRouter.get("/", getProfile);
profileRouter.put("/", uploadAvatar.single("avatar"), updateProfile);

profileRouter.use(
  (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        msg: "Profile image must be 10 MB or smaller",
        type: "WARNING",
      });
    }

    if (error.message === "Only image files are allowed") {
      return res.status(400).json({
        msg: error.message,
        type: "WARNING",
      });
    }

    return res.status(500).json({
      msg: error.message || "Unable to update profile",
      type: "ERROR",
    });
  }
);
