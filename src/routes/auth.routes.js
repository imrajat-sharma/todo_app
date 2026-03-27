const express = require("express");

const authController = require("../controller/auth.controller");
const { authenticate, redirectIfAuthenticated } = require("../middleware/Auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/register", redirectIfAuthenticated, authController.registerPage);
router.post("/register", redirectIfAuthenticated, upload.single("profileImage"), authController.register);

router.get("/login", redirectIfAuthenticated, authController.loginPage);
router.post("/login", redirectIfAuthenticated, authController.login);
router.get("/reset", redirectIfAuthenticated, authController.resetPage);

router.post("/refresh", authController.refreshSession);
router.post("/logout", authenticate, authController.logout);
router.post("/password", authenticate, authController.updatePassword);

module.exports = router;
