import jwt from "jsonwebtoken";

const authDoctor = (req, res, next) => {
  try {
    // Check for the custom dToken header
    const dToken = req.header("dToken");

    if (!dToken) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Ensure JWT_SECRET is present
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: JWT_SECRET missing" });
    }

    // Verify the token
    const decoded = jwt.verify(dToken, process.env.JWT_SECRET);

    // Attach doctor info to the request (use req.user or req)
    req.user = { docId: decoded.id }; // Or req.user = decoded if you want all the decoded info

    console.log("🔐 Authenticated Doctor ID:", req.user.docId); // Corrected to match the docId key
    next();
  } catch (error) {
    console.error("❌ Error in authDoctor:", error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token has expired" });
    }

    res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export default authDoctor;
