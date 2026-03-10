const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const BlacklistedToken = require("../models/blacklisted-token.model");
const env = require("../config/env"); // Assuming env config exists, otherwise use process.env

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.exists({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token revoked" });
    }

    // Fallback to a default secret if env is not set, for development safety
    const secret = process.env.JWT_SECRET || "secret_key_change_me";

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).populate("role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isDeleted === true) {
      return res.status(401).json({ message: "Account is deleted" });
    }

    if (user.isRestricted === true) {
      return res.status(403).json({ message: "Account is restricted" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.name;

    if (!userRole) {
      return res.status(403).json({ message: "Role is required" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};
