const Order = require("../models/Order");
const Menu = require("../models/Menu");

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

    res.status(200).json({
      success: true,
      message: "Cash payment confirmed successfully",
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

    // Store cancellation details
    order.cancellation.isCancelled = true;
    order.cancellation.cancelledBy = req.user.id;
    order.cancellation.cancelledAt = new Date();
    order.cancellation.reason = reason;

    // Mark the order as cancelled
    order.orderStatus = "cancelled";

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

    // Calculate refund for the cancelled item
    const refundAmount = orderItem.price * orderItem.quantity;

    // Store item cancellation details
    orderItem.isCancelled = true;
    orderItem.cancellationReason = reason;
    orderItem.cancelledBy = req.user.id;
    orderItem.cancelledAt = new Date();

    // Record refund only when payment has already been made
    if (order.paymentStatus === "paid") {
      order.refund.refundAmount += refundAmount;
      order.refund.refundStatus = "pending";
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

module.exports = {
  createOrder,
  confirmCashPayment,
  cancelOrder,
  operatorCancelOrder,
  operatorCancelOrderItem,
};