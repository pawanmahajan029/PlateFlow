const express = require("express");

const router = express.Router();

const {
  createOrder,
  confirmCashPayment,
  cancelOrder,
  operatorCancelOrder,
} = require("../controllers/orderController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Create Order
router.post("/", protect, createOrder);

// Confirm Cash Payment - Operator only
router.put("/:id/payment",protect,authorize("operator"),confirmCashPayment);

//cancelOrder by customer 
router.post("/:id/cancel", protect, authorize("customer"), cancelOrder);

// Operator can cancel an order
router.post("/:id/operator-cancel",protect,authorize("operator"),operatorCancelOrder);

module.exports = router;
