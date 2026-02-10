// backend/config/cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const connectCloudinary = () => {
  const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary environment variables are missing');
    return;
  }

  try {
    cloudinary.config({
      cloud_name: CLOUDINARY_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

    console.log('✅ Cloudinary connected successfully!');
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error);
  }
};

export { cloudinary, connectCloudinary };
