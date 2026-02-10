import jwt from "jsonwebtoken";

const authAdmin = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const atoken = req.header("Authorization")?.split(" ")[1];

    if (!atoken) {
      return res.status(401).json({ success: false, message: "Not Authorized, Login Again" });
    }

    // Verify the token
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);

    // Log decoded token and env for debugging
    console.log("🧾 Decoded Token:", token_decode);
    console.log("🛡️ ENV ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

    // Check if the email matches the admin email
    if (token_decode.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Forbidden: Invalid Admin Access" });
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error("❌ Error in authAdmin:", error.message);
    res.status(403).json({ success: false, message: "Invalid Token" });
  }
};

export default authAdmin;
