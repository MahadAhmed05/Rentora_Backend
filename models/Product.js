const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  category: {
    type: String,
    enum: {
      values: ["Electronics", "Makeup", "Others"],
      message: "Category must be Electronics, Makeup, or Others",
    },
    required: [true, "Category is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  pricePerDay: {
    type: Number,
    required: [true, "Price per day is required"],
    min: [0, "Price per day must be a non-negative number"],
  },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
  },
  location: {
    type: String,
    required: [true, "Location (city name) is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: {
      values: ["available", "rented"],
      message: "Status must be 'available' or 'rented'",
    },
    default: "available",
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner ID is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for common filter queries
productSchema.index({ category: 1, location: 1, status: 1, pricePerDay: 1 });

module.exports = mongoose.model("Product", productSchema);
