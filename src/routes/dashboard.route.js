const express = require("express");

const dashboardController = require("../controller/dashboard.controller");
const { authenticate } = require("../middleware/Auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", authenticate, dashboardController.renderDashboard);
router.post("/profile", authenticate, upload.single("profileImage"), dashboardController.updateProfile);

module.exports = router;
