const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
} = require("../controllers/requestController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate, createRequestSchema } = require("../validators/schemas");

// Renter routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("renter"),
  validate(createRequestSchema),
  createRequest
);

router.get("/my", authMiddleware, roleMiddleware("renter"), getMyRequests);

// Owner routes
router.get(
  "/incoming",
  authMiddleware,
  roleMiddleware("owner"),
  getIncomingRequests
);

router.put(
  "/:id/accept",
  authMiddleware,
  roleMiddleware("owner"),
  acceptRequest
);

router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("owner"),
  rejectRequest
);

module.exports = router;
