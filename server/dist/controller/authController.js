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
exports.sendVerificationCode = exports.loginUser = exports.registerUser = void 0;
const userModel_1 = require("../models/userModel");
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const hashAndCompare_1 = require("../utils/hashAndCompare");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendMail_1 = require("../utils/sendMail");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!(name === null || name === void 0 ? void 0 : name.trim()) ||
            !(email === null || email === void 0 ? void 0 : email.trim()) ||
            !(password === null || password === void 0 ? void 0 : password.toString().trim())) {
            return res.status(401).json({
                msg: "All credentials required",
                type: "WARNING",
            });
        }
        // checking user in DB
        const userExisted = yield userModel_1.userModel.findOne({ email });
        if (userExisted) {
            return res.status(400).json({
                msg: "Email already exists !",
                type: "WARNING",
            });
        }
        const uploadedAvatar = req.file
            ? yield (0, cloudinaryUpload_1.uploadCloudinaryBuffer)(req.file.buffer)
            : null;
        const hashPassword = yield (0, hashAndCompare_1.hashString)(password.toString());
        const user = yield userModel_1.userModel.create(Object.assign({ name: name, email: email, password: hashPassword }, (uploadedAvatar && {
            avatar: {
                secure_url: uploadedAvatar.secure_url,
                public_id: uploadedAvatar.public_id,
            },
        })));
        if (user) {
            return res.status(200).json({
                msg: "Registered successfully",
                type: "SUCCESS",
            });
        }
        return res.status(400).json({
            msg: "Unable to registered !",
            type: "ERROR",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Internal server error !",
            type: "ERROR",
        });
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!(email === null || email === void 0 ? void 0 : email.trim()) || !(password === null || password === void 0 ? void 0 : password.toString().trim())) {
        return res.status(401).json({
            msg: "All credentials required",
            type: "WARNING",
        });
    }
    try {
        const user = yield userModel_1.userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                msg: "We couldn’t find an account with this email.",
                type: "WARNING",
            });
        }
        const comparePassowrd = yield (0, hashAndCompare_1.compareHashString)(password.toString(), user.password);
        if (!comparePassowrd) {
            return res.status(400).json({
                msg: "The password you entered is incorrect. Please try again.",
                type: "WARNING",
            });
        }
        const token = jsonwebtoken_1.default.sign(user._id.toString(), process.env.JWT_KEY);
        return res.status(200).cookie("AUTH_TOKEN", token).json({
            msg: "Logged in Successfully",
            type: "SUCCESS",
            token: token,
            user: user,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Internal server error !",
            type: "ERROR",
        });
    }
});
exports.loginUser = loginUser;
const sendVerificationCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(401).json({
                msg: "Email require !",
                type: "WARNING",
            });
        }
        const user = yield userModel_1.userModel.findOne({ email });
        if (user) {
            return res
                .status(400)
                .json({ msg: "Email already in use.", type: "ERROR" });
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        const html = `
    <div style="background: linear-gradient(135deg, #f0f4ff, #ffe1e1); padding: 20px 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="500" style="background-color: #ffffff; border-radius: 8px; padding: 15px 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center;">
          
          <tr>
            <td style="padding-bottom: 20px;">
             <h2>CODE SYNC<h2/>
            </td>
          </tr>

          <tr>
            <td style="font-size: 18px; font-weight: 500; padding-bottom: 15px; color: #333;">
              Verify Your Email Address
            </td>
          </tr>

          <tr>
            <td style="display: inline-block; background-color: #f2f2f2; padding: 18px 30px; border-radius: 6px; font-size: 28px; font-weight: 500; color: #000; letter-spacing: 2px; margin-bottom: 25px;">
              ${verificationCode}
            </td>
          </tr>

          <tr>
            <td style="font-size: 14px; color: #555; line-height: 1.6; padding-bottom: 25px;">
              You're one step away from unlocking the code in real time. Use the code above to verify your email and start coding.
            </td>
          </tr>

          <tr>
            <td style="font-size: 13px; color: #777; line-height: 1.5;">
              This code will expire in 10 minutes. If you did not request this, simply ignore this email.
            </td>
          </tr>

        </table>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="500" style="margin-top: 20px;">
          <tr>
            <td style="font-size: 12px; text-align: center; color: #aaa;">
              &copy; 2025 Code Sync. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
</div>

    `;
        const subject = "Your Email Verification Code";
        const response = yield (0, sendMail_1.sendMail)(email, subject, html);
        if (response) {
            return res.status(200).json({
                msg: "Verification code sended to you email address",
                type: "SUCCESS",
                verificationCode: verificationCode.toString(),
            });
        }
        return res.status(400).json({ msg: "Failed to send email", type: "ERROR" });
    }
    catch (error) {
        console.log(error);
        return res.status(502).json({
            msg: "Internal server error !",
            type: "ERROR",
        });
    }
});
exports.sendVerificationCode = sendVerificationCode;
