const Joi = require("joi");

// ─── Auth Schemas ────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("owner", "renter").required().messages({
    "any.only": "Role must be either 'owner' or 'renter'",
    "any.required": "Role is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// ─── Product Schemas ─────────────────────────────────────────────────────────

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "Product name is required",
    "any.required": "Product name is required",
  }),
  category: Joi.string()
    .valid("Electronics", "Makeup", "Others")
    .required()
    .messages({
      "any.only": "Category must be Electronics, Makeup, or Others",
      "any.required": "Category is required",
    }),
  description: Joi.string().trim().min(10).required().messages({
    "string.min": "Description must be at least 10 characters",
    "any.required": "Description is required",
  }),
  pricePerDay: Joi.number().min(0).required().messages({
    "number.base": "Price per day must be a number",
    "number.min": "Price per day must be a non-negative number",
    "any.required": "Price per day is required",
  }),
  imageUrl: Joi.string().uri().required().messages({
    "string.uri": "Image URL must be a valid URL",
    "any.required": "Image URL is required",
  }),
  location: Joi.string().trim().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),
});

const updateProductStatusSchema = Joi.object({
  status: Joi.string().valid("available").required().messages({
    "any.only": "Only 'available' status is allowed in this endpoint",
    "any.required": "Status is required",
  }),
});

// ─── Request Schemas ─────────────────────────────────────────────────────────

const createRequestSchema = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid product ID format",
      "any.required": "Product ID is required",
    }),
  startDate: Joi.date().greater("now").required().messages({
    "date.greater": "Start date must be in the future",
    "any.required": "Start date is required",
  }),
  endDate: Joi.date().greater(Joi.ref("startDate")).required().messages({
    "date.greater": "End date must be after start date",
    "any.required": "End date is required",
  }),
});

// ─── Validation Helper ────────────────────────────────────────────────────────

/**
 * Validates request body against a Joi schema.
 * Returns a middleware function.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ""));
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createProductSchema,
  updateProductStatusSchema,
  createRequestSchema,
};
