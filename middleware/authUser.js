import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
  try {
    // Check for the Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // Ensure JWT_SECRET is present in the environment variables
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT_SECRET missing" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to the request object
    req.userId = decoded.id; //
    //  You can use decoded directly if needed
    console.log("🔐 Authenticated User ID:", req.userId);
    next();
  } catch (error) {
    console.error("❌ Error in authUser:", error.message);

    // Handle specific JWT error cases
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    }

    // Catch any other errors and return an invalid token response
    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export default authUser;