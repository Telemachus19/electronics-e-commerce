const express = require("express");
const {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/users.controller");

const usersRouter = express.Router();

usersRouter.get("/", listUsers);
usersRouter.post("/", createUser);
usersRouter.get("/:id", getUserById);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);

module.exports = usersRouter;
