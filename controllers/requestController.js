const Request = require("../models/Request");
const Product = require("../models/Product");
const Booking = require("../models/Booking");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ─── Helper: Check date overlap in Bookings ───────────────────────────────────
/**
 * Returns true if there is an existing booking for productId
 * that overlaps with [startDate, endDate].
 * Overlap condition: newStart <= existingEnd AND newEnd >= existingStart
 */
const hasOverlap = async (productId, startDate, endDate, excludeBookingId = null) => {
  const query = {
    productId,
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return !!conflict;
};

// ─── POST /api/requests ───────────────────────────────────────────────────────
const createRequest = async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Both dates must be in the future
    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: "Start date must be in the future.",
      });
    }
    if (end <= now) {
      return res.status(400).json({
        success: false,
        message: "End date must be in the future.",
      });
    }

    // startDate must be before endDate
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date.",
      });
    }

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check for booking overlap
    const overlap = await hasOverlap(productId, start, end);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Product not available for selected dates",
      });
    }

    // Calculate total price (server-side only)
    const numberOfDays = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = numberOfDays * product.pricePerDay;

    // Create the request
    const rentalRequest = await Request.create({
      productId,
      renterId: req.user._id,
      ownerId: product.ownerId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Rental request submitted successfully.",
      data: rentalRequest,
    });
  } catch (error) {
    console.error("Create request error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create request.",
    });
  }
};

// ─── GET /api/requests/my ─────────────────────────────────────────────────────
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ renterId: req.user._id })
      .populate("productId", "name imageUrl pricePerDay location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch your requests.",
    });
  }
};

// ─── GET /api/requests/incoming ──────────────────────────────────────────────
const getIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      ownerId: req.user._id,
      status: "pending",
    })
      .populate("productId", "name imageUrl location")
      .populate("renterId", "name phone email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get incoming requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch incoming requests.",
    });
  }
};

// ─── PUT /api/requests/:id/accept ────────────────────────────────────────────
const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("productId", "name location pricePerDay")
      .populate("renterId", "name email phone")
      .populate("ownerId", "name phone");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Verify ownership
    if (request.ownerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request.",
      });
    }

    // Only pending requests can be accepted
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}.`,
      });
    }

    // Re-run overlap check (race condition guard)
    const overlap = await hasOverlap(
      request.productId._id,
      request.startDate,
      request.endDate
    );
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Dates are no longer available",
      });
    }

    // Update request status
    request.status = "accepted";
    await request.save();

    // Create booking
    const booking = await Booking.create({
      productId: request.productId._id,
      requestId: request._id,
      renterId: request.renterId._id,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    // Update product status to rented
    await Product.findByIdAndUpdate(request.productId._id, {
      status: "rented",
    });

    // Format dates for email
    const startFormatted = request.startDate.toDateString();
    const endFormatted = request.endDate.toDateString();
    const ownerPhone = request.ownerId.phone;
    const ownerName = request.ownerId.name;
    const productName = request.productId.name;
    const productLocation = request.productId.location;

    // Send email to renter
    await sendEmail({
      to: request.renterId.email,
      subject: "Your Rental Request Has Been Accepted",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2e7d32;">🎉 Rental Request Accepted!</h2>
          <p>Hi <strong>${request.renterId.name}</strong>,</p>
          <p>Great news! Your rental request for <strong>${productName}</strong> has been accepted.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Location:</strong> ${productLocation}</p>
            <p><strong>Rental Period:</strong> ${startFormatted} → ${endFormatted}</p>
            <p><strong>Total Price:</strong> PKR ${request.totalPrice}</p>
          </div>

          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Owner Contact</h3>
            <p><strong>Name:</strong> ${ownerName}</p>
            <p><strong>Phone:</strong> ${ownerPhone}</p>
            <p><strong>Address / Location:</strong> ${productLocation}</p>
          </div>

          <p>Please coordinate with the owner for pickup/delivery arrangements.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">— The Rentora Team</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Request accepted. Booking created and renter notified.",
      data: { request, booking },
    });
  } catch (error) {
    console.error("Accept request error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not accept request.",
    });
  }
};

// ─── PUT /api/requests/:id/reject ────────────────────────────────────────────
const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("productId", "name location")
      .populate("renterId", "name email")
      .populate("ownerId", "_id");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // Verify ownership
    if (request.ownerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this request.",
      });
    }

    // Only pending requests can be rejected
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}.`,
      });
    }

    request.status = "rejected";
    await request.save();

    // Format dates for email
    const startFormatted = request.startDate.toDateString();
    const endFormatted = request.endDate.toDateString();
    const productName = request.productId.name;
    const productLocation = request.productId.location;

    // Send rejection email to renter
    await sendEmail({
      to: request.renterId.email,
      subject: "Your Rental Request Was Rejected",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #c62828;">Rental Request Update</h2>
          <p>Hi <strong>${request.renterId.name}</strong>,</p>
          <p>We're sorry to inform you that your rental request for <strong>${productName}</strong> has been rejected by the owner.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details</h3>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Location:</strong> ${productLocation}</p>
            <p><strong>Requested Period:</strong> ${startFormatted} → ${endFormatted}</p>
          </div>

          <p>Don't worry! You can browse other available products on Rentora and submit a new request.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">— The Rentora Team</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Request rejected and renter notified.",
      data: request,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not reject request.",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
};
