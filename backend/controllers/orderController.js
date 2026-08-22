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

module.exports = {
  createOrder,confirmCashPayment,
};