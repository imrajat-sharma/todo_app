const express = require("express");
const router = express.Router();
const User = require("../model/user.model");

router.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/api/auth/login");
  }

  const user = await User.findById(req.session.userId).select("-password");

  res.render("dashboard", { user });
});

module.exports = router;