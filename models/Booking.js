const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: [true, "Request ID is required"],
  },
  renterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Renter ID is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient overlap queries
bookingSchema.index({ productId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
