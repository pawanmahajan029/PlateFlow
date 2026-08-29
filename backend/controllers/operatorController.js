
const User = require("../models/user");
const Order = require("../models/Order");
const ChefTask = require("../models/chefTask");

// Get Operator Profile
const getOperatorProfile = async (req, res) => {
  try {
    const operator = await User.findById(req.user.id).select("-password");

    if (!operator) {
      return res.status(404).json({
        success: false,
        message: "Operator not found",
      });
    }

    res.status(200).json({
      success: true,
      operator,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Create Chef
const createChef = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists.",
      });
    }

    const chef = await User.create({
      fullName,
      email,
      phone,
      password,
      role: "chef",
    });

    res.status(201).json({
      success: true,
      message: "Chef created successfully",
      chef: {
        id: chef._id,
        fullName: chef.fullName,
        email: chef.email,
        phone: chef.phone,
        role: chef.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update Chef Status
const updateChefStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive.",
      });
    }

    const chef = await User.findOne({
      _id: req.params.id,
      role: "chef",
    });

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "Chef not found.",
      });
    }

    chef.status = status;

    await chef.save();

    res.status(200).json({
      success: true,
      message: "Chef status updated successfully.",
      chef: {
        id: chef._id,
        fullName: chef.fullName,
        email: chef.email,
        role: chef.role,
        status: chef.status,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get All Chefs
const getAllChefs = async (req, res) => {
  try {
    const chefs = await User.find({ role: "chef" }).select("-password");

    res.status(200).json({
      success: true,
      count: chefs.length,
      chefs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Create Chef Task
const createChefTask = async (req, res) => {
  try {
    const { orderId, chefId, items } = req.body;

    if (!orderId || !chefId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order, Chef and items are required.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const chef = await User.findOne({
      _id: chefId,
      role: "chef",
      status: "active",
    });

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "Active Chef not found.",
      });
    }

    const chefTask = await ChefTask.create({
      order: orderId,
      chef: chefId,
      items,
      assignedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Chef task created successfully.",
      chefTask,
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
  getOperatorProfile,
  createChef,
  updateChefStatus,
  getAllChefs,
  createChefTask,
};