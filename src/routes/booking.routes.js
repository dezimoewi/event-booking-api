const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');
const { validate, bookingSchema } = require('../middleware/validation');

// All booking routes are protected
router.use(authMiddleware);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's bookings
 *       401:
 *         description: Unauthorized
 */
router.get('/', bookingController.getUserBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking (protected, owner only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled, seats returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found or not owned by user
 */
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;
