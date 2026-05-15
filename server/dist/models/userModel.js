"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        secure_url: { type: String },
        public_id: { type: String },
    },
}, { timestamps: true });
exports.userModel = (0, mongoose_1.model)("usermodels", userSchema);
