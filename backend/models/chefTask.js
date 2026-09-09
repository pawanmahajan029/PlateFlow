const mongoose = require("mongoose");

const chefTaskSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },

    // Store the reason when Chef rejects a task
    rejectionReason: {
      type: String,
      enum: [
        "",
        "ingredient_unavailable",
        "equipment_problem",
        "cannot_prepare_item",
        "other",
      ],
      default: "",
    },

    // Store additional details when Chef selects "other"
    rejectionDetails: {
      type: String,
      default: "",
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChefTask", chefTaskSchema);