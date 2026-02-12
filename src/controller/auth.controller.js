const User = require("../model/user.model");

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

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
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
    // res.status(200).json({
    //   success: true,
    //   message: "User logged in successfully",
    //   user: {
    //     id: user._id,
    //     name: user.name,
    //     username: user.username,
    //     email: user.email,
    //     profileImage: user.profileImage,
    //   },
    // });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  await req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Error logging out user",
        error: err.message,
      });
    }
  });
  res.clearCookie("connect.sid");
  res.redirect("/api/auth/login");
};
