const express = require("express");

const router = express.Router();

const {
  createOrder,
  confirmCashPayment,
} = require("../controllers/orderController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Create Order
router.post("/", protect, createOrder);

// Confirm Cash Payment - Operator only
router.put(
  "/:id/payment",
  protect,
  authorize("operator"),
  confirmCashPayment
);

module.exports = router;
