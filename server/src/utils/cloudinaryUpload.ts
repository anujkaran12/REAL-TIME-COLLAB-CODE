import {v2} from "cloudinary";
import dotenv from 'dotenv'
dotenv.config()
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadCloudinary = async (avatarUrl:string) => {
  try {
    

    const result = await v2.uploader.upload(avatarUrl, {
      folder: "avatars",
    });
    return result;

    
  } catch (error) {
    console.log(error)
    return null
  }
};
