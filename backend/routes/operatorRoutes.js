const express = require("express");

const router = express.Router();

const {
  getOperatorProfile,
  createChef,
  updateChefStatus,
  getAllChefs,
  createChefTask,
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

// Update Chef Status
router.put(
  "/chef/:id/status",
  protect,
  authorize("operator"),
  updateChefStatus
);

// Get All Chefs
router.get(
  "/chefs",
  protect,
  authorize("operator"),
  getAllChefs
);

// Create Chef Task
// Create Chef Task
router.post(
  "/chef-task",
  protect,
  authorize("operator"),
  createChefTask
);

module.exports = router;