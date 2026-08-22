const express = require("express");

const router = express.Router();

const {
  getOperatorProfile,
  createChef,
} = require("../controllers/operatorController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Operator Profile
router.get(
  "/profile",
  protect,
  authorize("operator"),
  getOperatorProfile
);

// Create Chef
router.post(
  "/chef",
  protect,
  authorize("operator"),
  createChef
);

module.exports = router;