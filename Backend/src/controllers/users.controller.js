const User = require("../models/user.model");
const Role = require("../models/role.model");

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
    const { firstName, lastName, email, phone, role } = req.body;

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

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
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

module.exports = {
  listUsers,
  createUser,
};
