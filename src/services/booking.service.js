const pool = require('../config/db');

const bookEvent = async (eventId, userId, seats = 1) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Row-level lock to prevent race conditions
    const eventResult = await client.query(
      'SELECT id, available_seats, title FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    const event = eventResult.rows[0];

    if (event.available_seats < seats) {
      await client.query('ROLLBACK');
      const error = new Error(
        `Not enough seats available. Requested: ${seats}, Available: ${event.available_seats}`
      );
      error.statusCode = 409;
      throw error;
    }

    // Check if user already has a booking for this event
    const existingBooking = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existingBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      const error = new Error('You already have a booking for this event.');
      error.statusCode = 409;
      throw error;
    }

    // Deduct available seats
    await client.query(
      'UPDATE events SET available_seats = available_seats - $1 WHERE id = $2',
      [seats, eventId]
    );

    // Insert booking
    const bookingResult = await client.query(
      'INSERT INTO bookings (user_id, event_id, seats_booked) VALUES ($1, $2, $3) RETURNING *',
      [userId, eventId, seats]
    );

    await client.query('COMMIT');

    return {
      booking: bookingResult.rows[0],
      event_title: event.title,
      remaining_seats: event.available_seats - seats,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getUserBookings = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, e.title as event_title, e.date as event_date, e.location as event_location
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.user_id = $1
     ORDER BY e.date ASC`,
    [userId]
  );

  return result.rows;
};

const cancelBooking = async (bookingId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the booking and verify ownership
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error('Booking not found or does not belong to you.');
      error.statusCode = 404;
      throw error;
    }

    const booking = bookingResult.rows[0];

    // Return seats to event (lock the event row)
    await client.query(
      'SELECT id FROM events WHERE id = $1 FOR UPDATE',
      [booking.event_id]
    );

    await client.query(
      'UPDATE events SET available_seats = available_seats + $1 WHERE id = $2',
      [booking.seats_booked, booking.event_id]
    );

    // Delete the booking
    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

    await client.query('COMMIT');

    return { message: 'Booking cancelled successfully.', seats_returned: booking.seats_booked };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { bookEvent, getUserBookings, cancelBooking };
