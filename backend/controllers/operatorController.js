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

// Find Chef With Lowest Workload
const findAvailableChef = async () => {
  const chefs = await User.find({
    role: "chef",
    status: "active",
  });

  if (chefs.length === 0) {
    return null;
  }

  let selectedChef = null;
  let lowestWorkload = Infinity;

  for (const chef of chefs) {
    const workload = await ChefTask.countDocuments({
      chef: chef._id,
      status: {
        $in: ["pending", "accepted", "preparing"],
      },
    });

    if (workload < lowestWorkload) {
      lowestWorkload = workload;
      selectedChef = chef;
    }
  }

  return selectedChef;
};

// Create Chef Task
const createChefTask = async (req, res) => {
  try {
    const { orderId, items } = req.body;

    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order and items are required.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Find Chef with the lowest workload
    const chef = await findAvailableChef();

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "No active Chef available.",
      });
    }

    const chefTask = await ChefTask.create({
      order: orderId,
      chef: chef._id,
      items,
      assignedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Chef task created successfully.",
      assignedChef: {
        id: chef._id,
        fullName: chef.fullName,
      },
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

// Get Rejected Chef Tasks
const getRejectedTasks = async (req, res) => {
  try {
    const tasks = await ChefTask.find({
      status: "rejected",
    })
      .populate("order")
      .populate("chef")
      .populate("items.menuItem");

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Reassign Chef Task
const reassignChefTask = async (req, res) => {
  try {
    const { chefId } = req.body;

    if (!chefId) {
      return res.status(400).json({
        success: false,
        message: "Chef ID is required.",
      });
    }

    const task = await ChefTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Chef task not found.",
      });
    }

    if (task.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Only rejected tasks can be reassigned.",
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

    task.chef = chefId;
    task.status = "pending";
    task.assignedBy = req.user.id;

    await task.save();

    res.status(200).json({
      success: true,
      message: "Chef task reassigned successfully.",
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get All Chef Tasks
const getAllChefTasks = async (req, res) => {
  try {
    const tasks = await ChefTask.find()
      .populate("order")
      .populate("chef", "fullName email status")
      .populate("items.menuItem");

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
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
  getRejectedTasks,
  reassignChefTask,
  getAllChefTasks,
};