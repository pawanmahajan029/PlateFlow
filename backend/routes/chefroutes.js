const express = require("express");

const router = express.Router();

const {
  getChefProfile, getMyTasks, updateTaskStatus,
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

// Get My Tasks
router.get(
  "/tasks",
  protect,
  authorize("chef"),
  getMyTasks
);

// Update Task Status
router.put(
  "/tasks/:id/status",
  protect,
  authorize("chef"),
  updateTaskStatus,
);

module.exports = router;