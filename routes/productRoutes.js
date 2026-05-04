const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProductStatus,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  validate,
  createProductSchema,
  updateProductStatusSchema,
} = require("../validators/schemas");

// Public routes
router.get("/", getAllProducts);

// ⚠️ NOTE: /my must be defined BEFORE /:id to avoid Express matching "my" as an id
router.get("/my", authMiddleware, roleMiddleware("owner"), getMyProducts);

router.get("/:id", getProductById);

// Protected — owner only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("owner"),
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("owner"),
  validate(updateProductStatusSchema),
  updateProductStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("owner"),
  deleteProduct
);

module.exports = router;
