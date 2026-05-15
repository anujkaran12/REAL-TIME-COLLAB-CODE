import { Schema, model } from "mongoose";

interface IUser {
  name: string;
  email: string;
  password: string;
  avatar?: {
    secure_url: string;
    public_id: string;
  };
}
const userSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: true }
);

export const userModel = model<IUser>("usermodels", userSchema);
