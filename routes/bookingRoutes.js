const express = require("express");
const router = express.Router();

const { getBookingsByProduct } = require("../controllers/bookingController");

// Public — GET /api/bookings/product/:productId
router.get("/product/:productId", getBookingsByProduct);

module.exports = router;
