const express = require("express");
const {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  setUserRestriction,
} = require("../controllers/users.controller");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const usersRouter = express.Router();

usersRouter.use(authenticate, authorizeRoles("admin"));

usersRouter.get("/", listUsers);
usersRouter.post("/", createUser);
usersRouter.get("/:id", getUserById);
usersRouter.put("/:id", updateUser);
usersRouter.patch("/:id/restriction", setUserRestriction);
usersRouter.delete("/:id", deleteUser);

module.exports = usersRouter;
