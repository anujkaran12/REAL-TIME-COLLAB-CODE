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
exports.deleteCloudinaryAsset = exports.uploadCloudinaryBuffer = exports.uploadCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadCloudinary = (avatarUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.v2.uploader.upload(avatarUrl, {
            folder: "avatars",
        });
        return result;
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.uploadCloudinary = uploadCloudinary;
const uploadCloudinaryBuffer = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "avatars" }, (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Unable to upload avatar"));
                    return;
                }
                resolve(result);
            });
            uploadStream.end(buffer);
        });
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.uploadCloudinaryBuffer = uploadCloudinaryBuffer;
const deleteCloudinaryAsset = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!publicId) {
        return;
    }
    try {
        yield cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.log(error);
    }
});
exports.deleteCloudinaryAsset = deleteCloudinaryAsset;
