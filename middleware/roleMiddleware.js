/**
 * Role-based access middleware factory.
 * Usage: roleMiddleware("owner") or roleMiddleware("renter")
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedRoles.join(" or ")} can perform this action.`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
