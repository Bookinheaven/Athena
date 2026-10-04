import jwt from "jsonwebtoken";
import userRepository from "../repositories/userRepository.js";
import env from "../config/env.js";

const adminAuth = async (req, res, next) => {
  try {
    let token = "";
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await userRepository.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    const role = user.accountType || user.type;
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "User is not authorized. Admin role required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
      error: error.message,
    });
  }
};

export default adminAuth;
