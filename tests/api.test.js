const request = require('supertest');

// Important: app must not start listening during tests (we ensure this via NODE_ENV === 'test')
process.env.NODE_ENV = 'test';

require('dotenv').config();

const app = require('../src/app');

describe('API integration - happy path', () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  const name = 'Test User';

  let jwtToken;
  let eventId;

  // Ensure tests run sequentially in the intended order
  test('POST /api/auth/register -> registers a test user successfully (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name, email, password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('token');

    // token is returned by authService.register
    jwtToken = res.body.data.token;

    expect(res.body.data.user).toHaveProperty('email', email);
  });

  test('POST /api/auth/login -> logs in and stores returned JWT token (200)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('token');

    jwtToken = res.body.data.token;
    expect(typeof jwtToken).toBe('string');
    expect(jwtToken.length).toBeGreaterThan(10);
  });

  test('POST /api/events -> blocks creation with a 401 if no authorization token is supplied', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const res = await request(app).post('/api/events').send({
      title: 'Test Event',
      description: 'Integration test event',
      date: futureDate,
      location: 'Test Location',
      total_seats: 10,
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/events -> creates an event when authenticated and saves generated event ID (201)', async () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        title: `Test Event ${Date.now()}`,
        description: 'Integration test event',
        date: futureDate,
        location: 'Test Location',
        total_seats: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('id');

    eventId = res.body.data.id;
    expect(eventId).toBeDefined();
  });

  test('GET /api/events -> fetches list of current events (200) and validates response is an array', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

