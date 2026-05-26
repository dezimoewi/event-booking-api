const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const eventSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow('').optional(),
  date: Joi.date().iso().required(),
  location: Joi.string().max(255).optional(),
  total_seats: Joi.number().integer().min(1).required(),
});

const eventUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().allow('').optional(),
  date: Joi.date().iso().optional(),
  location: Joi.string().max(255).optional(),
  total_seats: Joi.number().integer().min(1).optional(),
}).min(1);

const bookingSchema = Joi.object({
  seats: Joi.number().integer().min(1).default(1),
});

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ error: { message: 'Validation failed', details: messages } });
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ error: { message: 'Validation failed', details: messages } });
  }
  req.query = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  eventSchema,
  eventUpdateSchema,
  bookingSchema,
  paginationSchema,
  validate,
  validateQuery,
};
