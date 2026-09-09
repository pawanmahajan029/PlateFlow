const Order = require("../models/Order");
const Menu = require("../models/Menu");
const ChefTask = require("../models/chefTask");
const { assignOrderItemsToChefs } = require("../services/chefAssignmentService");

// Create Order
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // Check if items are provided
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required.",
      });
    }

    let orderItems = [];
    let totalAmount = 0;

    // Check every menu item
    for (const item of items) {
      const { menuItem, quantity } = item;

      if (!menuItem || !quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu item or quantity.",
        });
      }

      const menu = await Menu.findById(menuItem);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${menuItem}`,
        });
      }

      if (!menu.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menu.name} is currently unavailable.`,
        });
      }

      const itemTotal = menu.price * quantity;

      orderItems.push({
        menuItem: menu._id,
        quantity,
        price: menu.price,
      });

      totalAmount += itemTotal;
    }

    // Create Order
    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      totalAmount,
      paymentMethod: "cash",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get a single order for the customer
const getOrderById = async (req, res) => {
  try {
    // Find the order by ID
    const order = await Order.findById(req.params.id).populate(
      "items.menuItem"
    );

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Make sure the customer owns this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own order",
      });
    }

    // Send order details to customer
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders for the logged-in customer
const getMyOrders = async (req, res) => {
  try {
    // Find all orders belonging to the logged-in customer
    const orders = await Order.find({
      customer: req.user.id,
    })
      .populate("items.menuItem")
      .sort({ createdAt: -1 });

    // Send customer's orders
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders for the operator
const getAllOrdersForOperator = async (req, res) => {
  try {
    // Get order status and payment status from query parameters
    const { status, paymentStatus } = req.query;

    // Validate order status if provided
    if (
      status &&
      ![
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Validate payment status if provided
    if (paymentStatus && !["pending", "paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Create filter
    const filter = {};

    // Apply order status filter if provided
    if (status) {
      filter.orderStatus = status;
    }

    // Apply payment status filter if provided
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Find orders using the filters
    const orders = await Order.find(filter)
      .populate("customer", "fullName email phone")
      .populate("items.menuItem")
      .sort({ createdAt: -1 });

    // Send orders to operator
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single order for the operator
const getOperatorOrderById = async (req, res) => {
  try {
    // Find the order by ID
    const order = await Order.findById(req.params.id)
      .populate("customer", "fullName email phone")
      .populate("items.menuItem");

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Send order details to operator
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Confirm Cash Payment
const confirmCashPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check payment method
    if (order.paymentMethod !== "cash") {
      return res.status(400).json({
        success: false,
        message: "This order is not a cash payment order.",
      });
    }

    // Check if already paid
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment is already confirmed.",
      });
    }

    // Confirm payment
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    // Automatically assign order items to Chefs
    let chefTasks = [];

    try {
      chefTasks = await assignOrderItemsToChefs(
        order,
        req.user.id
      );
    } catch (error) {
      // Payment is confirmed, but Chef assignment needs operator attention
      return res.status(200).json({
        success: true,
        message:
          "Cash payment confirmed, but Chef assignment could not be completed.",
        order,
        chefTasks: [],
        warning: error.message,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Cash payment confirmed and order assigned to Chefs successfully",
      order,
      chefTasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Cancel Order By Customer when payment is pending
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Make sure the customer owns this order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own order",
      });
    }

    // Customer can cancel only before payment
    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled by customer after payment",
      });
    }

    // Check if already cancelled
    if (order.cancellation.isCancelled) {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    order.cancellation.isCancelled = true;
    order.cancellation.cancelledBy = req.user.id;
    order.cancellation.cancelledAt = new Date();
    order.cancellation.reason = reason;

    order.orderStatus = "cancelled";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Operator can cancel an order
const operatorCancelOrder = async (req, res) => {
  try {
    // Check if order exists
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is already cancelled
    if (order.cancellation.isCancelled) {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    const { reason, refundAmount = 0 } = req.body;

    // Cancellation reason is required
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    // Validate refund amount
    if (refundAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot be negative",
      });
    }

    if (refundAmount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed order total",
      });
    }

    // Refund is allowed only for paid orders
    if (refundAmount > 0 && order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Refund can only be recorded for a paid order.",
      });
    }

    // Store cancellation details
    order.cancellation.isCancelled = true;
    order.cancellation.cancelledBy = req.user.id;
    order.cancellation.cancelledAt = new Date();
    order.cancellation.reason = reason;

    // Mark the order as cancelled
    order.orderStatus = "cancelled";

    // Cancel all pending Chef Tasks for the cancelled order
    await ChefTask.updateMany(
      {
        order: order._id,
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
        },
      }
    );

    // Record refund details if a refund is applicable
    if (refundAmount > 0 && order.paymentStatus === "paid") {
      order.refund.refundAmount = refundAmount;
      order.refund.refundStatus = "pending";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully by operator",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Operator can cancel a specific item from an order
const operatorCancelOrderItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { reason } = req.body;

    // Check if order exists
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Cancellation reason is required
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    // Find the specific item inside the order
    const orderItem = order.items.id(itemId);

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Check if the item is already cancelled
    if (orderItem.isCancelled) {
      return res.status(400).json({
        success: false,
        message: "Order item is already cancelled",
      });
    }

    // Cancel all remaining units of the order item
    orderItem.cancelledQuantity =
      orderItem.quantity - orderItem.cancelledQuantity;

    // Calculate refund for the cancelled quantity
    const refundAmount =
      orderItem.price * orderItem.cancelledQuantity;

    // Store item cancellation details
    orderItem.isCancelled = true;
    orderItem.cancellationReason = reason;
    orderItem.cancelledBy = req.user.id;
    orderItem.cancelledAt = new Date();

    // Cancel pending Chef Tasks containing the cancelled item
    await ChefTask.updateMany(
      {
        order: order._id,
        status: "pending",
        "items.menuItem": orderItem.menuItem,
      },
      {
        $set: {
          status: "cancelled",
        },
      }
    );

    // Record refund only when payment has already been made
    if (order.paymentStatus === "paid") {
      order.refund.refundAmount += refundAmount;
      order.refund.refundStatus = "pending";
    }

    // Check if all Chef Tasks are completed or cancelled
    const remainingTasks = await ChefTask.countDocuments({
      order: order._id,
      status: { $nin: ["completed", "cancelled"] },
    });

    // Mark the order as completed when no active tasks remain
    if (remainingTasks === 0) {
      order.orderStatus = "completed";
    }
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order item cancelled successfully",
      refundAmount,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Operator can mark a refund as processed
const processRefund = async (req, res) => {
  try {
    // Check if order exists
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if a refund is pending
    if (order.refund.refundStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending refund found for this order",
      });
    }

    // Mark refund as processed
    order.refund.refundStatus = "processed";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Refund marked as processed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
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
};