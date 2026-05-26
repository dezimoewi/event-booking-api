const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth');
const { validate, validateQuery, eventSchema, eventUpdateSchema, paginationSchema, bookingSchema } = require('../middleware/validation');

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events (public)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events starting from this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events up to this date
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', validateQuery(paginationSchema), eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details with booking summary
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (protected)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - total_seats
 *             properties:
 *               title:
 *                 type: string
 *                 example: New Year Gala
 *               description:
 *                 type: string
 *                 example: A fancy new year celebration
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T20:00:00Z"
 *               location:
 *                 type: string
 *                 example: Grand Ballroom, NYC
 *               total_seats:
 *                 type: integer
 *                 example: 200
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error or date in the past
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validate(eventSchema), eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (protected, creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               total_seats:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized (not the creator)
 *       404:
 *         description: Event not found
 */
router.put('/:id', authMiddleware, validate(eventUpdateSchema), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}/book:
 *   post:
 *     summary: Book seats for an event (protected, transactional)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seats:
 *                 type: integer
 *                 default: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Booking confirmed
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Not enough seats or duplicate booking
 */
router.post('/:id/book', authMiddleware, validate(bookingSchema), bookingController.bookEvent);

module.exports = router;
