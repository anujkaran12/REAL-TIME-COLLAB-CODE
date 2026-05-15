import { v2 } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadCloudinary = async (avatarUrl: string) => {
  try {
    const result = await v2.uploader.upload(avatarUrl, {
      folder: "avatars",
    });
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const uploadCloudinaryBuffer = async (buffer: Buffer) => {
  try {
    return await new Promise<Awaited<ReturnType<typeof v2.uploader.upload>>>(
      (resolve, reject) => {
        const uploadStream = v2.uploader.upload_stream(
          { folder: "avatars" },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Unable to upload avatar"));
              return;
            }

            resolve(result);
          }
        );

        uploadStream.end(buffer);
      }
    );
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const deleteCloudinaryAsset = async (publicId?: string) => {
  if (!publicId) {
    return;
  }

  try {
    await v2.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
  }
};
