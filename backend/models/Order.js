const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
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

        // Track how many units of this item were cancelled
        cancelledQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        // Item-level cancellation
        isCancelled: {
          type: Boolean,
          default: false,
        },

        cancellationReason: {
          type: String,
          default: "",
        },

        cancelledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        cancelledAt: {
          type: Date,
          default: null,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Order-level cancellation
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false,
      },

      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        default: "",
      },
    },

    // Refund information
    refund: {
      refundAmount: {
        type: Number,
        default: 0,
      },

      refundStatus: {
        type: String,
        enum: ["not_required", "pending", "processed"],
        default: "not_required",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);