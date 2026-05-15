import { Schema, model } from "mongoose";

const sessionParticipantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "usermodels",
    },
    name: String,
    email: String,
    avatar: {
      secure_url: String,
      public_id: String,
    },
    socketID: String,
    role: {
      type: String,
      enum: ["HOST", "GUEST"],
      default: "GUEST",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: Date,
  },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    roomID: {
      type: String,
      required: true,
      unique: true,
    },
    roomTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    roomPassword: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: "usermodels",
      required: true,
    },
    hostSocketId: String,
    maxParticipants: {
      type: Number,
      min: 2,
      max: 21,
      default: 6,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ENDED"],
      default: "ACTIVE",
    },
    lastCode: {
      type: String,
      default: "",
    },
    lastLanguage: {
      type: String,
      default: "javascript",
    },
    lastEditedBy: String,
    lastEditedAt: Date,
    participants: [sessionParticipantSchema],
    endedAt: Date,
  },
  { timestamps: true }
);

export const sessionModel = model("sessions", sessionSchema);
