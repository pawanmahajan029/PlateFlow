const User = require("../models/user");
const ChefTask = require("../models/chefTask");
const Order = require("../models/Order");

// Get Chef Profile
const getChefProfile = async (req, res) => {
  try {
    const chef = await User.findById(req.user.id).select("-password");

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "Chef not found",
      });
    }

    res.status(200).json({
      success: true,
      chef,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get My Chef Tasks
const getMyTasks = async (req, res) => {
  try {
    const tasks = await ChefTask.find({
      chef: req.user.id,
    })
      .populate("order")
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

// Update Chef Task Status
const updateTaskStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const allowedStatuses = [
      "accepted",
      "rejected",
      "preparing",
      "ready",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    // Rejection reason is required when Chef rejects a task
    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const task = await ChefTask.findOne({
      _id: req.params.id,
      chef: req.user.id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Pending → Accepted / Rejected
    if (
      task.status === "pending" &&
      !["accepted", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Pending task can only be accepted or rejected.",
      });
    }

    // Accepted → Preparing
    if (task.status === "accepted" && status !== "preparing") {
      return res.status(400).json({
        success: false,
        message: "Accepted task can only move to preparing.",
      });
    }

    // Preparing → Ready
    if (task.status === "preparing" && status !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Preparing task can only move to ready.",
      });
    }

    // Ready → Completed
    if (task.status === "ready" && status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Ready task can only move to completed.",
      });
    }

    task.status = status;

    // Store rejection reason when Chef rejects the task
    if (status === "rejected") {
      task.rejectionReason = rejectionReason;
    }

    await task.save();

    // Find the related Order
    const order = await Order.findById(task.order);

    if (order) {
      // Accepted → Order preparing
      if (status === "accepted") {
        order.orderStatus = "preparing";
      }

      // Ready → Order ready
      if (status === "ready") {
        order.orderStatus = "ready";
      }

      // Completed → Check all Chef Tasks
      if (status === "completed") {
        const remainingTasks = await ChefTask.countDocuments({
          order: task.order,
          status: { $nin: ["completed", "cancelled"] },
        });

        if (remainingTasks === 0) {
          order.orderStatus = "completed";
        }
      }

      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
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

module.exports = {
  getChefProfile,
  getMyTasks,
  updateTaskStatus,
};