const Role = require("../models/role.model");

const listRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    return res.status(200).json({ data: roles });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch roles" });
  }
};

const createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    return res.status(201).json({ data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Role already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create role" });
  }
};

module.exports = {
  listRoles,
  createRole,
};
