# Event Booking API

A secure Event Management and Booking API built with Node.js, Express, and PostgreSQL. Features JWT authentication, role-based access control, pagination, date filtering, and **transactional booking with row-level locking** to prevent race conditions and overbooking.

## Features

- User registration & login with JWT authentication
- CRUD operations for events with pagination and date filtering
- Atomic seat booking with PostgreSQL row-level locking (`SELECT ... FOR UPDATE`)
- Booking cancellation with seat restoration
- Input validation with Joi
- Rate limiting & security headers (helmet)
- Swagger API documentation

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (raw parameterized SQL via `pg`)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** Joi
- **Security:** helmet, express-rate-limit
- **Docs:** swagger-jsdoc + swagger-ui-express

## Project Structure

```
├── db/
│   ├── schema.sql          # Database table definitions
│   └── seed.js             # Seed script with sample data
├── src/
│   ├── config/
│   │   ├── db.js           # PostgreSQL connection pool
│   │   └── swagger.js      # Swagger configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   └── booking.controller.js
│   ├── middleware/
│   │   ├── auth.js         # JWT verification middleware
│   │   ├── errorHandler.js # Centralized error handler
│   │   ├── rateLimiter.js  # Rate limiting configs
│   │   └── validation.js   # Joi schemas & validators
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   └── booking.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── event.service.js
│   │   └── booking.service.js
│   └── app.js              # Express app entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Local Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Clone the repository

```bash
git clone git@github.com:dezimoewi/event-booking-api.git
cd event-booking-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a PostgreSQL database

```bash
createdb task_manager
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_manager
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
```

### 5. Seed the database

```bash
npm run seed
```

This creates tables and inserts 3 sample users and 8 sample events.

**Sample credentials:**
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- `charlie@example.com` / `password123`

### 6. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 7. View API Documentation

Open http://localhost:3000/api-docs in your browser.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | List events (paginated, filterable) | No |
| GET | `/api/events/:id` | Get event details + booking summary | No |
| POST | `/api/events` | Create a new event | Yes |
| PUT | `/api/events/:id` | Update an event (creator only) | Yes |

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/events/:id/book` | Book seats for an event | Yes |
| GET | `/api/bookings` | Get your bookings | Yes |
| DELETE | `/api/bookings/:id` | Cancel a booking | Yes |

## Testing with cURL

### Register a user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "mypassword"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'
```

Save the token from the response:
```bash
export TOKEN="your_jwt_token_here"
```

### List events with pagination and date filter

```bash
curl "http://localhost:3000/api/events?limit=5&offset=0&start_date=2026-06-01&end_date=2026-09-01"
```

### Get a single event

```bash
curl http://localhost:3000/api/events/1
```

### Create an event (authenticated)

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "My Event", "description": "A cool event", "date": "2026-12-01T18:00:00Z", "location": "Downtown", "total_seats": 100}'
```

### Book seats for an event (transactional)

```bash
curl -X POST http://localhost:3000/api/events/1/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"seats": 2}'
```

### View your bookings

```bash
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel a booking

```bash
curl -X DELETE http://localhost:3000/api/bookings/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Concurrency Control

The booking system uses PostgreSQL transactions with row-level locking to prevent race conditions:

```sql
BEGIN;
SELECT available_seats FROM events WHERE id = $1 FOR UPDATE;
-- Check seats, deduct, insert booking
COMMIT;
```

This ensures that even if two users try to book the last seat at the same millisecond, only one will succeed — the other receives a `409 Conflict` response.

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Description of what went wrong"
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error / Bad request |
| 401 | Unauthenticated (no/invalid token) |
| 403 | Unauthorized (not the resource owner) |
| 404 | Resource not found |
| 409 | Conflict (duplicate booking, insufficient seats) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## License

ISC
