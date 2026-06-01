const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');
const { validate, validateQuery, eventSchema, eventUpdateSchema, paginationSchema, bookingSchema } = require('../middleware/validation');

router.get('/', validateQuery(paginationSchema), eventController.getAllEvents);

router.get('/:id', eventController.getEventById);

router.post('/', authMiddleware, validate(eventSchema), eventController.createEvent);

router.put('/:id', authMiddleware, validate(eventUpdateSchema), eventController.updateEvent);

router.post('/:id/book', authMiddleware, validate(bookingSchema), bookingController.bookEvent);

module.exports = router;

