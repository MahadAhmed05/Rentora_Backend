const Booking = require("../models/Booking");

// ─── GET /api/bookings/product/:productId ─────────────────────────────────────
const getBookingsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const bookings = await Booking.find({ productId }).select(
      "startDate endDate -_id"
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch bookings.",
    });
  }
};

module.exports = { getBookingsByProduct };
