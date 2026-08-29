const express = require("express");

const router = express.Router();

const {
  getChefProfile,
} = require("../controllers/chefController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Chef Profile
router.get(
  "/profile",
  protect,
  authorize("chef"),
  getChefProfile
);

module.exports = router;