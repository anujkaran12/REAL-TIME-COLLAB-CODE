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
exports.updateProfile = exports.getProfile = void 0;
const userModel_1 = require("../models/userModel");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield userModel_1.userModel.findById(req.userID).select("-password");
        if (!user) {
            return res.status(404).json({
                msg: "User not found",
                type: "ERROR",
            });
        }
        return res.status(200).json({
            msg: "Profile fetched",
            type: "SUCCESS",
            user,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Unable to fetch profile",
            type: "ERROR",
        });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { name, removeAvatar } = req.body;
        const user = yield userModel_1.userModel.findById(req.userID);
        if (!user) {
            return res.status(404).json({
                msg: "User not found",
                type: "ERROR",
            });
        }
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    msg: "Name is required",
                    type: "WARNING",
                });
            }
            user.name = name.trim();
        }
        if (removeAvatar === "true") {
            yield (0, cloudinaryUpload_1.deleteCloudinaryAsset)((_a = user.avatar) === null || _a === void 0 ? void 0 : _a.public_id);
            user.avatar = undefined;
        }
        if (req.file) {
            yield (0, cloudinaryUpload_1.deleteCloudinaryAsset)((_b = user.avatar) === null || _b === void 0 ? void 0 : _b.public_id);
            const uploadedAvatar = yield (0, cloudinaryUpload_1.uploadCloudinaryBuffer)(req.file.buffer);
            if (!uploadedAvatar) {
                return res.status(400).json({
                    msg: "Unable to upload profile image",
                    type: "ERROR",
                });
            }
            user.avatar = {
                secure_url: uploadedAvatar.secure_url,
                public_id: uploadedAvatar.public_id,
            };
        }
        yield user.save();
        const updatedUser = yield userModel_1.userModel.findById(user._id).select("-password");
        return res.status(200).json({
            msg: "Profile updated",
            type: "SUCCESS",
            user: updatedUser,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Unable to update profile",
            type: "ERROR",
        });
    }
});
exports.updateProfile = updateProfile;
