const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  renterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Renter ID is required"],
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner ID is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "accepted", "rejected"],
      message: "Status must be 'pending', 'accepted', or 'rejected'",
    },
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", requestSchema);
