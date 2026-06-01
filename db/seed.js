require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS bookings CASCADE');
    await client.query('DROP TABLE IF EXISTS events CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        total_seats INTEGER NOT NULL CHECK (total_seats > 0),
        available_seats INTEGER NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT seats_check CHECK (available_seats >= 0 AND available_seats <= total_seats)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        seats_booked INTEGER NOT NULL DEFAULT 1 CHECK (seats_booked > 0),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, event_id)
      )
    `);

    const hashedPassword = await bcrypt.hash('password123', 10);

    await client.query(`
      INSERT INTO users (name, email, password) VALUES
      ($1, $2, $3),
      ($4, $5, $6),
      ($7, $8, $9)
    `, [
      'Alice Johnson', 'alice@example.com', hashedPassword,
      'Bob Smith', 'bob@example.com', hashedPassword,
      'Charlie Brown', 'charlie@example.com', hashedPassword,
    ]);

    await client.query(`
      INSERT INTO events (title, description, date, location, total_seats, available_seats, created_by) VALUES
      ('Tech Conference 2026', 'Annual technology conference', '2026-07-15 09:00:00', 'Convention Center, NYC', 500, 500, 1),
      ('Music Festival', 'Summer outdoor music festival', '2026-08-20 14:00:00', 'Central Park, NYC', 1000, 1000, 1),
      ('Startup Pitch Night', 'Entrepreneurs pitch their ideas', '2026-06-10 18:00:00', 'Innovation Hub, SF', 100, 100, 2),
      ('Cooking Workshop', 'Learn gourmet cooking techniques', '2026-07-05 10:00:00', 'Culinary School, LA', 30, 30, 2),
      ('AI Summit', 'Artificial intelligence research summit', '2026-09-12 08:00:00', 'Tech Campus, Seattle', 200, 200, 3),
      ('Yoga Retreat', 'Weekend wellness and yoga retreat', '2026-08-01 06:00:00', 'Mountain Lodge, CO', 50, 50, 3),
      ('Book Club Meetup', 'Monthly fiction book discussion', '2026-06-25 19:00:00', 'City Library, Boston', 25, 25, 1),
      ('Hackathon 2026', '48-hour coding competition', '2026-10-01 09:00:00', 'University Hall, Austin', 150, 150, 2)
    `);

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
