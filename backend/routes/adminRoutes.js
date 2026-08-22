const express = require("express");

const router = express.Router();

const {
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  createOperator,
  resetAdminPassword,
} = require("../controllers/adminController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Create Admin
router.post("/", protect, authorize("superAdmin"), createAdmin);

// Get All Admins
router.get("/", protect, authorize("superAdmin"), getAllAdmins);

// Update Admin
router.put("/:id", protect, authorize("superAdmin"), updateAdmin);

// Delete Admin
router.delete("/:id", protect, authorize("superAdmin"), deleteAdmin);

// Create Operator
router.post("/operator",protect,authorize("admin"),createOperator);

// Reset Admin Password
router.put("/:id/reset-password",protect,authorize("superAdmin"),resetAdminPassword);

module.exports = router;