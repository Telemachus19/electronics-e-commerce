const express = require("express");
const { register, login, logout, verifyEmail } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate, logout);

module.exports = authRouter;