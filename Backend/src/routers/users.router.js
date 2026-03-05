const express = require("express");
const { listUsers, createUser } = require("../controllers/users.controller");

const usersRouter = express.Router();

usersRouter.get("/", listUsers);
usersRouter.post("/", createUser);

module.exports = usersRouter;
