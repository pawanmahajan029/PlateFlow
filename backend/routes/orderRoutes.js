const express = require("express");

const router = express.Router();

const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrdersForOperator,
  getOperatorOrderById,
  confirmCashPayment,
  cancelOrder,
  operatorCancelOrder,
  operatorCancelOrderItem,
  processRefund,
} = require("../controllers/orderController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/rolemiddleware");

// Create Order
router.post("/", protect, authorize("customer"), createOrder);

// Customer can view all their orders
router.get("/", protect, authorize("customer"), getMyOrders);

// Operator can view all customer orders
router.get("/operator", protect, authorize("operator"), getAllOrdersForOperator);

// Operator can view a single order
router.get("/operator/:id", protect, authorize("operator"), getOperatorOrderById);

// Customer can track/view a single order
router.get("/:id", protect, authorize("customer"), getOrderById);

// Confirm Cash Payment - Operator only
router.put("/:id/payment",protect,authorize("operator"),confirmCashPayment);

//cancelOrder by customer 
router.post("/:id/cancel", protect, authorize("customer"), cancelOrder);

// Operator can cancel an order
router.post("/:id/operator-cancel",protect,authorize("operator"),operatorCancelOrder);

// Operator can cancel a specific item from an order
router.post("/:id/item/:itemId/cancel",protect,authorize("operator"),operatorCancelOrderItem);

// Operator can process a pending refund
router.put("/:id/refund",protect,authorize("operator"),processRefund);

module.exports = router;
