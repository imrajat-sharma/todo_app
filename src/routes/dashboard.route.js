const express = require("express");
const router = express.Router();
const User = require("../model/user.model");

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/api/auth/login");
  }

  const user = await User.findById(req.session.userId).select("-password");

  if (req.session?.message || req.session.userId) {
    res.render("dashboard", { user, message: req.session.message });
  } else {
    res.render("dashboard", { user });
  }
});

router.patch("/update/:userid", async (req, res) => {
  const userId = req.params.userid;
  const updatedUser = req.body;
  try {
    const ALLOWED = new Set(["name", "email", "password"]);

    const isAllowed = Object.keys(updatedUser).every((field) =>
      ALLOWED.has(field),
    );

    if (!isAllowed) {
      throw new Error("Chosen field cannot be updated.");
    }

    const user = await User.findByIdAndUpdate(userId, updatedUser, {
      returnDocument: true,
      runValidators: true,
    });

    res.status(200).json({
      user: user,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Error updating user",
    });
  }
});

module.exports = router;
