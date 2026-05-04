const Product = require("../models/Product");
const Booking = require("../models/Booking");

// ─── POST /api/products ────────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { name, category, description, pricePerDay, imageUrl, location } =
      req.body;

    const product = await Product.create({
      name,
      category,
      description,
      pricePerDay,
      imageUrl,
      location,
      ownerId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not create product.",
    });
  }
};

// ─── GET /api/products ─────────────────────────────────────────────────────────
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    // Base filter — only available products
    const filter = { status: "available" };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all products error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch products.",
    });
  }
};

// ─── GET /api/products/my ─────────────────────────────────────────────────────
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ ownerId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get my products error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch your products.",
    });
  }
};

// ─── GET /api/products/:id ────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "ownerId",
      "name phone"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Fetch booked date ranges for this product
    const bookedDates = await Booking.find({ productId: product._id }).select(
      "startDate endDate -_id"
    );

    return res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        bookedDates,
      },
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch product.",
    });
  }
};

// ─── PUT /api/products/:id/status ─────────────────────────────────────────────
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Only the owner of this product can update it
    if (product.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product.",
      });
    }

    product.status = status;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product status updated successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Update product status error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not update product status.",
    });
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Only the owner of this product can delete it
    if (product.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product.",
      });
    }

    // Block deletion if an active or future booking exists
    const activeBooking = await Booking.findOne({
      productId: product._id,
      endDate: { $gte: new Date() },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this product. It is currently rented or has an upcoming booking.",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error. Could not delete product.",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProductStatus,
  deleteProduct,
};
