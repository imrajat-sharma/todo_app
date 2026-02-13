const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const upload = require("../middleware/upload");


router
  .route("/register")
  .get((req, res) => {
    res.render("auth/register");
  })
  .post(upload.single("profileImage"), authController.register);

router
  .route("/login")
  .get((req, res) => {
    res.render("auth/login");
  })
  .post(authController.login);

router.get("/logout", authController.logout)

module.exports = router;
