"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const profileController_1 = require("../controller/profileController");
const uploadAvatar_1 = require("../middleware/uploadAvatar");
exports.profileRouter = express_1.default.Router();
exports.profileRouter.get("/", profileController_1.getProfile);
exports.profileRouter.put("/", uploadAvatar_1.uploadAvatar.single("avatar"), profileController_1.updateProfile);
exports.profileRouter.use((error, _req, res, _next) => {
    if (error instanceof multer_1.default.MulterError && error.code === "LIMIT_FILE_SIZE") {
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
});
