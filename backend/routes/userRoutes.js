const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/usercontroller");
const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Profile
router.get("/profile", protect, getProfile);

// Admin Test Route
router.get(
  "/admin-test",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

module.exports = router;