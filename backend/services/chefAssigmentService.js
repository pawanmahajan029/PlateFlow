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

module.exports = {
  findAvailableChef,
  assignOrderItemsToChefs,
};