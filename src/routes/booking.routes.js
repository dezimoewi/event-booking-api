const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');
const { validate, bookingSchema } = require('../middleware/validation');

router.use(authMiddleware);

router.get('/', bookingController.getUserBookings);

router.delete('/:id', bookingController.cancelBooking);

module.exports = router;

