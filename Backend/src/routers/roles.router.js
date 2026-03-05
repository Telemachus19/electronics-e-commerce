const express = require("express");
const { listRoles, createRole } = require("../controllers/roles.controller");

const rolesRouter = express.Router();

rolesRouter.get("/", listRoles);
rolesRouter.post("/", createRole);

module.exports = rolesRouter;
