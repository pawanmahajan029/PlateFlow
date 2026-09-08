const User = require("../models/user");
const ChefTask = require("../models/chefTask");

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

// Automatically assign order items to available Chefs
const assignOrderItemsToChefs = async (order, assignedBy) => {
  const chefTasks = [];
  const assignments = {};

  // Check if Chef Tasks are already created for this order
  const existingTasks = await ChefTask.findOne({
    order: order._id,
  });

  if (existingTasks) {
    throw new Error("Chef Tasks are already created for this order.");
  }

  // Get all active Chefs
  const chefs = await User.find({
    role: "chef",
    status: "active",
  });

  // Stop if no active Chef is available
  if (chefs.length === 0) {
    throw new Error("No active Chef available to assign the order.");
  }

  // Store current workload of each Chef
  const workloads = {};

  for (const chef of chefs) {
    workloads[chef._id.toString()] = await ChefTask.countDocuments({
      chef: chef._id,
      status: {
        $in: ["pending", "accepted", "preparing"],
      },
    });
  }

  // Assign each order item
  for (const item of order.items) {
    // Skip cancelled items
    if (item.isCancelled) {
      continue;
    }

    // Assign each quantity unit
    for (let i = 0; i < item.quantity; i++) {
      let selectedChef = null;
      let lowestWorkload = Infinity;

      // Find Chef with the lowest current workload
      for (const chef of chefs) {
        const chefId = chef._id.toString();

        if (workloads[chefId] < lowestWorkload) {
          lowestWorkload = workloads[chefId];
          selectedChef = chef;
        }
      }

      // Stop if no Chef is available
      if (!selectedChef) {
        throw new Error("No active Chef available to assign the order.");
      }

      const chefId = selectedChef._id.toString();

      // Create Chef assignment if it does not exist
      if (!assignments[chefId]) {
        assignments[chefId] = {
          chef: selectedChef,
          items: [],
        };
      }

      // Check if this menu item is already assigned to this Chef
      const existingItem = assignments[chefId].items.find(
        (assignedItem) =>
          assignedItem.menuItem.toString() === item.menuItem.toString()
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        assignments[chefId].items.push({
          menuItem: item.menuItem,
          quantity: 1,
        });
      }

      // Increase workload for the next assignment
      workloads[chefId] += 1;
    }
  }

  // Create one Chef Task for each Chef
  for (const chefId in assignments) {
    const assignment = assignments[chefId];

    const chefTask = await ChefTask.create({
      order: order._id,
      chef: assignment.chef._id,
      items: assignment.items,
      assignedBy,
    });

    chefTasks.push(chefTask);
  }

  return chefTasks;
};

// Redistribute pending tasks when a Chef becomes inactive
const redistributeChefTasks = async (chefId, assignedBy) => {
  // Find pending tasks assigned to the inactive Chef
  const pendingTasks = await ChefTask.find({
    chef: chefId,
    status: "pending",
  });

  // Stop if there are no pending tasks
  if (pendingTasks.length === 0) {
    return [];
  }

  // Get active Chefs
  const activeChefs = await User.find({
    role: "chef",
    status: "active",
  });

  // Stop if no active Chef is available
  if (activeChefs.length === 0) {
    return [];
  }

  // Store current workload of each active Chef
  const workloads = {};

  for (const chef of activeChefs) {
    workloads[chef._id.toString()] = await ChefTask.countDocuments({
      chef: chef._id,
      status: {
        $in: ["pending", "accepted", "preparing"],
      },
    });
  }

  // Redistribute each pending task
  for (const task of pendingTasks) {
    let selectedChef = null;
    let lowestWorkload = Infinity;

    // Find Chef with the lowest workload
    for (const chef of activeChefs) {
      const currentWorkload = workloads[chef._id.toString()];

      if (currentWorkload < lowestWorkload) {
        lowestWorkload = currentWorkload;
        selectedChef = chef;
      }
    }

    if (!selectedChef) {
      continue;
    }

    // Assign task to the selected Chef
    task.chef = selectedChef._id;
    task.assignedBy = assignedBy;

    await task.save();

    // Increase workload for the next task
    workloads[selectedChef._id.toString()] += 1;
  }

  return {
  redistributedCount: pendingTasks.length,
  tasks: pendingTasks,
  };
};

module.exports = {
  findAvailableChef,
  assignOrderItemsToChefs,
  redistributeChefTasks,
};