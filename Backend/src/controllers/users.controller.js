const User = require("../models/user.model");
const Role = require("../models/role.model");
const bcrypt = require("bcryptjs");

const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("firstName lastName email phone role")
      .populate("role", "name");

    return res.status(200).json({ data: users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    let roleId = role;
    if (!roleId) {
      const customerRole = await Role.findOne({ name: "customer" });
      if (!customerRole) {
        return res
          .status(400)
          .json({
            message: "Default customer role is missing. Run role seed first.",
          });
      }
      roleId = customerRole._id;
    } else {
      const roleExists = await Role.exists({ _id: roleId });
      if (!roleExists) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || "DefaultPass123!", salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: roleId,
    });

    const createdUser = await User.findById(user._id)
      .select("firstName lastName email phone role")
      .populate("role", "name");

    return res.status(201).json({ data: createdUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create user" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("firstName lastName email phone role")
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phone, role },
      { new: true, runValidators: true }
    )
      .select("firstName lastName email phone role")
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
};
