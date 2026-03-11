const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const BlacklistedToken = require("../models/blacklisted-token.model");
const { sendOtpEmail } = require("../middlewares/email.service");

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "secret_key_change_me";
  return jwt.sign({ id: user._id, role: user.role.name }, secret, {
    expiresIn: "1d",
  });
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
      return res
        .status(500)
        .json({ message: "System error: Default role not found" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: customerRole._id,
      isApproved: false, // Will be set to true upon email verification
      isEmailVerified: false,
      otp,
      otpExpires,
    });

    // Send OTP Email
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Note: In a production app, you might want to rollback user creation here
    }

    return res.status(201).json({
      message: "Registration successful. Please check your email for the OTP.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email })
      .select("+otp +otpExpires")
      .populate("role");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (
      !user.otp ||
      !user.otpExpires ||
      user.otp !== otp ||
      user.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify and Auto-Approve
    user.isEmailVerified = true;
    user.isApproved = true; // Auto-approve customer after email verification
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Verification failed" });
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

    // Keep email verification mandatory for new users while allowing legacy users
    // that may not have this field set in older records.
    if (user.isEmailVerified === false) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    if (user.isDeleted === true) {
      return res.status(403).json({ message: "Account is deleted" });
    }

    if (user.isApproved === false) {
      return res.status(403).json({ message: "Account pending approval" });
    }

    if (user.isRestricted === true) {
      return res.status(403).json({ message: "Account is restricted" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
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

module.exports = { register, login, logout, verifyEmail };
