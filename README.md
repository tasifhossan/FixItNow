# FixItNow — Home Services Marketplace API

A backend API for a home services marketplace connecting customers with verified technicians for services like plumbing, electrical work, cleaning, and AC repair. Built as Assignment B7A4.

## Tech Stack

- **Runtime:** Node.js + Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma
- **Auth:** JWT (access + refresh tokens)
- **Payments:** SSLCommerz (sandbox)
- **Validation:** Zod

## Features

- Role-based access: `CUSTOMER`, `TECHNICIAN`, `ADMIN`
- JWT auth with access/refresh token rotation
- Technician profile management, availability toggling, and service assignment
- Category and service catalog (admin-managed)
- Full booking lifecycle: `REQUESTED → ACCEPTED/DECLINED → PAID → IN_PROGRESS → COMPLETED` (or `CANCELLED`)
- Real payment integration via SSLCommerz with server-side transaction verification
- Reviews and technician rating aggregation (only on completed bookings)
- Admin dashboard stats and booking oversight

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)
- An [SSLCommerz sandbox account](https://developer.sslcommerz.com/registration/) for payment testing

### 1. Clone and install
```bash
git clone https://github.com/tasifhossan/FixItNow.git
cd FixItNow
npm install
```

### 2. Configure environment variables
Copy the example file and fill in real values:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Secrets for signing tokens |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (e.g. `15m`, `30d`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost factor |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the seeded admin account |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` | From your SSLCommerz sandbox account |
| `SSLCOMMERZ_IS_LIVE` | `false` for sandbox |
| `BASE_URL` | Publicly reachable URL for payment callbacks (use [ngrok](https://ngrok.com) in local dev) |
| `FRONTEND_URL` | Where payment callbacks redirect after processing |

### 3. Set up the database
```bash
npx prisma migrate dev
npx prisma db seed
```
This applies the schema and seeds an admin user plus sample categories and services.

### 4. Run the server
```bash
npm run dev
```
Server starts at `http://localhost:5000`. Health check: `GET /api/v1/health`.

## API Documentation

A full Postman collection is included: [`FixItNow.postman_collection.json`](./FixItNow.postman_collection.json). Import it into Postman, set the `baseUrl` collection variable to your running server (e.g. `http://localhost:5000/api/v1`), and log in to auto-populate `accessToken` for subsequent requests.

### Endpoint overview

| Module | Method | Endpoint | Access |
|---|---|---|---|
| Auth | POST | `/auth/register` | Public |
| Auth | POST | `/auth/login` | Public |
| Auth | POST | `/auth/refresh-token` | Public (cookie) |
| Auth | POST | `/auth/logout` | Public |
| User | GET | `/users/me` | Authenticated |
| User | PATCH | `/users/me` | Authenticated |
| User | PATCH | `/users/change-password` | Authenticated |
| User | GET | `/users` | Admin |
| User | PATCH | `/users/:id/toggle-block` | Admin |
| Technician | GET | `/technicians` | Public |
| Technician | GET | `/technicians/:id` | Public |
| Technician | PATCH | `/technicians/me/profile` | Technician |
| Technician | PATCH | `/technicians/me/availability` | Technician |
| Technician | POST | `/technicians/me/services` | Technician |
| Technician | PATCH | `/technicians/:id/verify` | Admin |
| Category | GET / POST / PATCH / DELETE | `/categories` | Public read, Admin write |
| Service | GET / POST / PATCH / DELETE | `/services` | Public read, Admin write |
| Booking | POST | `/bookings` | Customer |
| Booking | GET | `/bookings/my-bookings` | Customer |
| Booking | GET | `/bookings/assigned-to-me` | Technician |
| Booking | PATCH | `/bookings/:id/respond` | Technician |
| Booking | PATCH | `/bookings/:id/status` | Technician |
| Booking | PATCH | `/bookings/:id/cancel` | Customer/Admin |
| Payment | POST | `/payments/initiate` | Customer |
| Payment | POST | `/payments/callback/success\|fail\|cancel` | SSLCommerz (server-to-server) |
| Payment | GET | `/payments/:bookingId/status` | Authenticated |
| Review | POST | `/reviews` | Customer |
| Review | GET | `/reviews/technician/:technicianId` | Public |
| Admin | GET | `/admin/stats` | Admin |
| Admin | GET | `/admin/bookings` | Admin |

## Project Structure

```
src/
├── app.ts, server.ts       # Express app + startup
├── config/                 # Centralized env config
├── errors/                 # AppError + Zod/Prisma error formatters
├── middlewares/             # auth, roleGuard, validateRequest, error handling
├── modules/                 # Feature modules (auth, user, technician, category,
│                            #   service, booking, payment, review, admin)
├── routes/                  # Central router aggregation
├── shared/                  # Prisma client singleton
└── utils/                   # catchAsync, sendResponse, jwtHelpers, pick
prisma/
├── schema.prisma
└── seed.ts
```

## Notes

- Admin registration is intentionally blocked at the API level — the only admin account is the one seeded via `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- Payment status is only ever set to `PAID` after server-side re-verification against SSLCommerz's transaction validation API — the callback payload itself is never trusted directly.
- Booking status transitions are enforced in the service layer, not left to client trust.