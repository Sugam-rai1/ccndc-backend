// backend/config/cloudinary.js

import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = () => {
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;

  console.log("🔍 Checking Cloudinary env vars...");
  console.log("CLOUDINARY_CLOUD_NAME:", CLOUDINARY_CLOUD_NAME);
  console.log("CLOUDINARY_API_KEY exists:", !!CLOUDINARY_API_KEY);
  console.log("CLOUDINARY_API_SECRET exists:", !!CLOUDINARY_API_SECRET);

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new Error("❌ Cloudinary environment variables are missing");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  console.log("✅ Cloudinary connected successfully!");
};

export { cloudinary, connectCloudinary };
