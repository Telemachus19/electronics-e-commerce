const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const BlacklistedToken = require("../models/blacklisted-token.model");
const { sendOtpEmail } = require("../middlewares/email.service");
const {
  normalizePhoneNumber,
  buildPhoneSearchVariants,
} = require("../utils/phone.util");

const OTP_EXPIRY_MINUTES = 15;
const RESEND_COOLDOWN_MINUTES = 2;

const createOtpPayload = () => {
  const now = Date.now();

  return {
    otp: Math.floor(100000 + Math.random() * 900000).toString(),
    otpExpires: new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000),
    otpLastSentAt: new Date(now),
    resendAvailableAt: new Date(now + RESEND_COOLDOWN_MINUTES * 60 * 1000),
  };
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "secret_key_change_me";
  return jwt.sign({ id: user._id, role: user.role.name }, secret, {
    expiresIn: "1d",
  });
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

    // Check if user exists
    const queryConditions = [{ email }];
    if (normalizedPhone) {
      queryConditions.push({ phone: { $in: buildPhoneSearchVariants(normalizedPhone) } });
    }

    const existingUser = await User.findOne({
      $or: queryConditions,
    });
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

    const otpPayload = createOtpPayload();

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      password: hashedPassword,
      role: customerRole._id,
      isEmailVerified: false,
      otp: otpPayload.otp,
      otpExpires: otpPayload.otpExpires,
      otpLastSentAt: otpPayload.otpLastSentAt,
    });

    // Send OTP Email
    try {
      await sendOtpEmail(email, otpPayload.otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Note: In a production app, you might want to rollback user creation here
    }

    return res.status(201).json({
      message: "Registration successful. Please check your email for the OTP.",
      resendAvailableAt: otpPayload.resendAvailableAt.toISOString(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select(
      "+otp +otpExpires +otpLastSentAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const now = Date.now();
    const resendAvailableAt = user.otpLastSentAt
      ? new Date(
          user.otpLastSentAt.getTime() + RESEND_COOLDOWN_MINUTES * 60 * 1000,
        )
      : null;

    if (resendAvailableAt && resendAvailableAt.getTime() > now) {
      return res.status(429).json({
        message: "Please wait before requesting another verification code.",
        resendAvailableAt: resendAvailableAt.toISOString(),
      });
    }

    const otpPayload = createOtpPayload();
    user.otp = otpPayload.otp;
    user.otpExpires = otpPayload.otpExpires;
    user.otpLastSentAt = otpPayload.otpLastSentAt;
    await user.save();

    await sendOtpEmail(email, otpPayload.otp);

    return res.status(200).json({
      message: "A new verification code has been sent to your email.",
      resendAvailableAt: otpPayload.resendAvailableAt.toISOString(),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to resend verification email" });
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

    // Mark user as verified and clear one-time verification data.
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpLastSentAt = undefined;
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
    const phoneVariants = buildPhoneSearchVariants(identifier);

    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: { $in: phoneVariants } }],
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

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("firstName lastName email phone role isEmailVerified")
      .populate("role", "name");

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phone } = req.body;

    const updatePayload = {};

    if (typeof firstName === "string" && firstName.trim()) {
      updatePayload.firstName = firstName;
    }

    if (typeof lastName === "string" && lastName.trim()) {
      updatePayload.lastName = lastName;
    }

    if (typeof email === "string" && email.trim()) {
      updatePayload.email = email;
    }

    if (typeof phone === "string" && phone.trim()) {
      updatePayload.phone = normalizePhoneNumber(phone);
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      updatePayload,
      { new: true, runValidators: true },
    )
      .select("firstName lastName email phone role isEmailVerified")
      .populate("role", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = {
  register,
  resendVerificationEmail,
  login,
  logout,
  verifyEmail,
  getCurrentUser,
  updateOwnProfile,
};
