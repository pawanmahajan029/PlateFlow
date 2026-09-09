const express = require("express");

const router = express.Router();

const {
  getOperatorProfile,
  createChef,
  updateChefStatus,
  getAllChefs,
  createChefTask,
  getRejectedTasks,
  confirmIngredientUnavailable,
  reassignChefTask,
  getAllChefTasks,
  getChefWorkload,
  getKitchenSummary,
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
router.post(
  "/chef-task",
  protect,
  authorize("operator"),
  createChefTask
);

// Get Rejected Chef Tasks
router.get(
  "/chef-tasks/rejected",
  protect,
  authorize("operator"),
  getRejectedTasks
);

// Confirm ingredient unavailable and cancel the order item
router.post(
  "/orders/:id/ingredient-unavailable",
  protect,
  authorize("operator"),
  confirmIngredientUnavailable
);

// Reassign Chef Task
router.put(
  "/chef-task/:id/reassign",
  protect,
  authorize("operator"),
  reassignChefTask
);

// Get All Chef Tasks
router.get(
  "/chef-tasks",
  protect,
  authorize("operator"),
  getAllChefTasks
);

// Get Chef Workload
router.get(
  "/chef-workload",
  protect,
  authorize("operator"),
  getChefWorkload
);

// Get Kitchen Summary
router.get(
  "/kitchen-summary",
  protect,
  authorize("operator"),
  getKitchenSummary
);
module.exports = router;