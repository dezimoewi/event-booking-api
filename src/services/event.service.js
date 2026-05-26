const pool = require('../config/db');

const getAllEvents = async ({ limit, offset, start_date, end_date }) => {
  let query = 'SELECT * FROM events';
  const params = [];
  const conditions = [];

  if (start_date && end_date) {
    conditions.push(`date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(start_date, end_date);
  } else if (start_date) {
    conditions.push(`date >= $${params.length + 1}`);
    params.push(start_date);
  } else if (end_date) {
    conditions.push(`date <= $${params.length + 1}`);
    params.push(end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination metadata
  let countQuery = 'SELECT COUNT(*) FROM events';
  const countParams = [];
  if (start_date && end_date) {
    countQuery += ' WHERE date BETWEEN $1 AND $2';
    countParams.push(start_date, end_date);
  } else if (start_date) {
    countQuery += ' WHERE date >= $1';
    countParams.push(start_date);
  } else if (end_date) {
    countQuery += ' WHERE date <= $1';
    countParams.push(end_date);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return { events: result.rows, total, limit, offset };
};

const getEventById = async (id) => {
  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  const bookingResult = await pool.query(
    'SELECT COALESCE(SUM(seats_booked), 0) as total_booked FROM bookings WHERE event_id = $1',
    [id]
  );

  const event = eventResult.rows[0];
  event.seats_booked = parseInt(bookingResult.rows[0].total_booked, 10);

  return event;
};

const createEvent = async ({ title, description, date, location, total_seats }, userId) => {
  // Verify date is in the future
  if (new Date(date) <= new Date()) {
    const error = new Error('Event date must be in the future.');
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO events (title, description, date, location, total_seats, available_seats, created_by)
     VALUES ($1, $2, $3, $4, $5, $5, $6)
     RETURNING *`,
    [title, description || null, date, location || null, total_seats, userId]
  );

  return result.rows[0];
};

const updateEvent = async (id, updates, userId) => {
  // Check event exists and belongs to user
  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  const event = eventResult.rows[0];
  if (event.created_by !== userId) {
    const error = new Error('You are not authorized to update this event.');
    error.statusCode = 403;
    throw error;
  }

  // If updating total_seats, ensure it's not less than already booked
  if (updates.total_seats) {
    const bookedResult = await pool.query(
      'SELECT COALESCE(SUM(seats_booked), 0) as total_booked FROM bookings WHERE event_id = $1',
      [id]
    );
    const totalBooked = parseInt(bookedResult.rows[0].total_booked, 10);

    if (updates.total_seats < totalBooked) {
      const error = new Error(`Cannot reduce total seats below already booked count (${totalBooked}).`);
      error.statusCode = 400;
      throw error;
    }

    // Recalculate available_seats
    updates.available_seats = updates.total_seats - totalBooked;
  }

  // If updating date, ensure it's in the future
  if (updates.date && new Date(updates.date) <= new Date()) {
    const error = new Error('Event date must be in the future.');
    error.statusCode = 400;
    throw error;
  }

  // Build dynamic update query
  const fields = [];
  const params = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${paramIndex}`);
    params.push(value);
    paramIndex++;
  }

  params.push(id);
  const query = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(query, params);

  return result.rows[0];
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent };
