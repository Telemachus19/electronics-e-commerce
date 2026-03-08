const express = require("express");
const {
  listRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roles.controller");

const rolesRouter = express.Router();

rolesRouter.get("/", listRoles);
rolesRouter.post("/", createRole);
rolesRouter.get("/:id", getRoleById);
rolesRouter.put("/:id", updateRole);
rolesRouter.delete("/:id", deleteRole);

module.exports = rolesRouter;
