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
    const { name, description, permissions } = req.body;
    const roleData = { name, description, permissions };

    const role = await Role.create(roleData);
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

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({ data: role });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch role" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({ data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Role name already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update role" });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete role" });
  }
};

module.exports = {
  listRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
};
