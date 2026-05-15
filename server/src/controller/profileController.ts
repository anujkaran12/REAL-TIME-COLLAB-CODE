import { userModel } from "../models/userModel";
import { AuthenticatedRequest, Response } from "../types";
import {
  deleteCloudinaryAsset,
  uploadCloudinaryBuffer,
} from "../utils/cloudinaryUpload";

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userModel.findById(req.userID).select("-password");

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Unable to fetch profile",
      type: "ERROR",
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { name, removeAvatar } = req.body;
    const user = await userModel.findById(req.userID);

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
      await deleteCloudinaryAsset(user.avatar?.public_id);
      user.avatar = undefined as any;
    }

    if (req.file) {
      await deleteCloudinaryAsset(user.avatar?.public_id);
      const uploadedAvatar = await uploadCloudinaryBuffer(req.file.buffer);

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

    await user.save();
    const updatedUser = await userModel.findById(user._id).select("-password");

    return res.status(200).json({
      msg: "Profile updated",
      type: "SUCCESS",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Unable to update profile",
      type: "ERROR",
    });
  }
};
