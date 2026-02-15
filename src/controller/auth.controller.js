const User = require("../model/user.model");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  const { name, username, email, password, profileImage } = req.body;
  try {
    const user = await User.create({
      name,
      email,
      username,
      password,
      profileImage: req.file ? req.file.filename : null,
    });

    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file." });
    }
    req.session.userId = user._id;
    req.session.message = "User registered successfully";
    res.redirect("/dashboard");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

exports.logout = (req, res) => {
  if (!req.session) {
    res.clearCookie("sessions");
    return res.redirect("/api/auth/login");
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error logging out user",
        error: err.message,
      });
    }

    res.clearCookie("sessions");
    res.redirect("/api/auth/login");
  });
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};
