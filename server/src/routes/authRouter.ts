import express from 'express'
import multer from 'multer';
import { loginUser, registerUser, sendVerificationCode } from '../controller/authController';
import { uploadAvatar } from '../middleware/uploadAvatar';
import { NextFunction, Request, Response } from '../types';

export const authRouter = express.Router();

authRouter.post("/send-verification-code",sendVerificationCode)
authRouter.post("/register", uploadAvatar.single("avatar"), registerUser)
authRouter.post("/login",loginUser)

authRouter.use(
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
      msg: error.message || "Unable to upload profile image",
      type: "ERROR",
    });
  }
);

