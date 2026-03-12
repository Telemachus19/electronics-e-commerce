const User = require("../models/user.model");
const Role = require("../models/role.model");
const bcrypt = require("bcryptjs");
const { normalizePhoneNumber } = require("../utils/phone.util");

const listUsers = async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";

    const users = await User.find(includeDeleted ? {} : { isDeleted: false })
      .select(
        "firstName lastName email phone role isEmailVerified isRestricted isDeleted deletedAt",
      )
      .populate("role", "name");

    return res.status(200).json({ data: users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      isEmailVerified,
    } =
      req.body;

    let roleId = role;
    if (!roleId) {
      const customerRole = await Role.findOne({ name: "customer" });
      if (!customerRole) {
        return res.status(400).json({
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
    const hashedPassword = await bcrypt.hash(
      password || "DefaultPass123!",
      salt,
    );

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: normalizePhoneNumber(phone),
      password: hashedPassword,
      role: roleId,
      isEmailVerified:
        typeof isEmailVerified === "boolean" ? isEmailVerified : true,
    });

    const createdUser = await User.findById(user._id)
      .select(
        "firstName lastName email phone role isEmailVerified isRestricted isDeleted deletedAt",
      )
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
      .select(
        "firstName lastName email phone role isEmailVerified isRestricted isDeleted deletedAt",
      )
      .populate("role", "name");

    if (!user || user.isDeleted) {
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
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      isEmailVerified,
      isRestricted,
    } = req.body;

    const updatePayload = {};

    if (typeof firstName === "string") {
      updatePayload.firstName = firstName;
    }

    if (typeof lastName === "string") {
      updatePayload.lastName = lastName;
    }

    if (typeof email === "string") {
      updatePayload.email = email;
    }

    if (typeof phone === "string") {
      updatePayload.phone = normalizePhoneNumber(phone);
    }

    if (role !== undefined) {
      const roleExists = await Role.exists({ _id: role });
      if (!roleExists) {
        return res.status(400).json({ message: "Invalid role specified" });
      }
      updatePayload.role = role;
    }

    if (typeof isEmailVerified === "boolean") {
      updatePayload.isEmailVerified = isEmailVerified;
    }

    if (typeof isRestricted === "boolean") {
      updatePayload.isRestricted = isRestricted;
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updatePayload,
      { new: true, runValidators: true },
    )
      .select(
        "firstName lastName email phone role isEmailVerified isRestricted isDeleted deletedAt",
      )
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
    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
        isRestricted: true,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

const setUserRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRestricted } = req.body;

    if (typeof isRestricted !== "boolean") {
      return res
        .status(400)
        .json({ message: "isRestricted must be a boolean" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isRestricted },
      { new: true, runValidators: true },
    )
      .select(
        "firstName lastName email phone role isEmailVerified isRestricted isDeleted deletedAt",
      )
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update restriction" });
  }
};

module.exports = {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  setUserRestriction,
};
