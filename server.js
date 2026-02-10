import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import { connectCloudinary } from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoutes.js";

// 1️⃣ Load environment variables FIRST
dotenv.config();

// 2️⃣ Safety check
if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI is missing");
}

const app = express();
const port = process.env.PORT || 4000;

// 3️⃣ Connect DB & Cloudinary
connectDB();
connectCloudinary();

// 4️⃣ Middleware
app.use(express.json());

// ✅ UPDATED CORS (LOCAL + LIVE)
app.use(
  cors({
    origin: [
      // Local development
      "http://localhost:5173",
      "http://localhost:5174",

      // 🔥 LIVE FRONTEND (replace with your real URLs)
      "https://ccndc.vercel.app",
      "https://ccndc-admin.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// 5️⃣ Static files
app.use("/uploads", express.static("uploads"));

// 6️⃣ Routes
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

// 7️⃣ Health check
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// 8️⃣ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

// 9️⃣ Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});
