import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import env from "../config/env.js";
import { isValidTimezone } from "../utils/dateUtils.js";

const auth = async (req, res, next) => {
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
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    req.user = user;

    const headerTz = req.headers["x-timezone"];
    const validHeaderTz = headerTz && isValidTimezone(headerTz) ? headerTz.trim() : null;

    if (!user.settings?.timezone) {
      // Unset preference: lazy-populate from client header if valid, otherwise default to "UTC"
      const detectedTz = validHeaderTz || "UTC";
      user.settings = user.settings || {};
      user.settings.timezone = detectedTz;
      User.updateOne({ _id: user._id }, { $set: { "settings.timezone": detectedTz } }).catch(() => null);
      req.timezone = detectedTz;
    } else {
      // Persisted user preference is authoritative across all devices
      req.timezone = user.settings.timezone;
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

export default auth;
