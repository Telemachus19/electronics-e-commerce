const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const BlacklistedToken = require("../models/blacklisted-token.model");

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "secret_key_change_me";
  return jwt.sign(
    { id: user._id, role: user.role.name },
    secret,
    { expiresIn: "1d" }
  );
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    // Assign default customer role
    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
      return res.status(500).json({ message: "System error: Default role not found" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: customerRole._id,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: "customer",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR phone

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).populate("role");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, role: user.role.name },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);

      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        await BlacklistedToken.create({ token, expiresAt });
      }
    }
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

module.exports = { register, login, logout };