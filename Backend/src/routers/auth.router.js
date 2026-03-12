const express = require("express");
const {
  register,
  resendVerificationEmail,
  login,
  logout,
  verifyEmail,
  getCurrentUser,
  updateOwnProfile,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/resend-verification-email", resendVerificationEmail);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.put("/me", authenticate, updateOwnProfile);

module.exports = authRouter;
