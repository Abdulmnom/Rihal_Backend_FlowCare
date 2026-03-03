# FlowCare — Queue & Appointment Booking System API

> A production-level backend API for a multi-branch queue and appointment booking system operating in Oman.

**Tech Stack:** Node.js · Express · PostgreSQL · Knex.js · JWT

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher
- npm (comes with Node.js)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Create the Database

Open **psql** or **pgAdmin** and run:

```sql
CREATE DATABASE flowcare;
```

Or from the terminal:

```bash
# Windows
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE flowcare"

# Linux / Mac
createdb -U postgres flowcare
```

### 3. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Then update `.env` with your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432          
DB_NAME=flowcare
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Logging
LOG_LEVEL=debug
```

### 4. Run Migrations (Create Tables)

```bash
npm run migrate
```

### 5. Seed the Database (Test Data)

```bash
npm run seed
```

Or run steps 4 and 5 together:

```bash
npm run db:setup
```

### 6. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm run start
```

✅ Server runs at: `http://localhost:3000`

---

## 📌 Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start the server |
| `npm run dev` | Start in development mode (auto-restart) |
| `npm run migrate` | Run all database migrations |
| `npm run migrate:rollback` | Rollback the last migration batch |
| `npm run seed` | Insert seed data |
| `npm run db:setup` | Run migrate + seed together |

---

## 🔗 Verify It's Running

After starting the server, open in your browser or Postman:

```
GET http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "FlowCare API is running",
  "timestamp": "2026-03-02T...",
  "environment": "development"
}
```

---

## 👥 Seed Data Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@flowcare.om` | `Password123!` | Admin |
| `manager.muscat@flowcare.om` | `Password123!` | Branch Manager |
| `manager.salalah@flowcare.om` | `Password123!` | Branch Manager |
| `ahmed.staff@flowcare.om` | `Password123!` | Staff |
| `fatma.staff@flowcare.om` | `Password123!` | Staff |
| `mohammed@customer.com` | `Password123!` | Customer |
| `sara@customer.com` | `Password123!` | Customer |

---

## 📁 Project Structure

```
Backend_FlowCare/
├── .env                          ← Environment config (not pushed to Git)
├── .env.example                  ← Example environment template
├── knexfile.js                   ← Knex config (DB connection + migrations)
├── package.json
├── README.md
└── src/
    ├── app.js                    ← Express app (middleware + routes)
    ├── server.js                 ← Entry point (starts the server)
    ├── config/
    │   ├── index.js              ← Central configuration
    │   ├── constants.js          ← Roles, statuses, audit actions
    │   └── logger.js             ← Winston logger
    ├── database/
    │   ├── connection.js         ← Knex connection singleton
    │   ├── migrations/           ← 10 migration files
    │   └── seeds/                ← Idempotent seed data
    ├── middleware/
    │   ├── authenticate.js       ← JWT verification
    │   ├── authorize.js          ← RBAC + branch scoping
    │   ├── errorHandler.js       ← Global error handler
    │   ├── upload.js             ← File upload (Multer)
    │   └── validate.js           ← Input validation (Joi)
    ├── routes/                   ← 10 route modules
    ├── services/                 ← 8 business logic services
    ├── utils/
    │   ├── asyncHandler.js       ← Async error wrapper
    │   └── errors.js             ← Custom error classes
    └── validators/
        └── schemas.js            ← All Joi validation schemas
```

---

## 🔌 API Endpoints

I Recomendded to use Postman to test the API.

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register a new customer |
| POST | `/api/v1/auth/login` | ❌ | Login and get tokens |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| PUT | `/api/v1/auth/change-password` | ✅ | Change password |
| GET | `/api/v1/auth/me` | ✅ | Get current user profile |

### Branches
| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/api/v1/branches` | ✅ | All |
| GET | `/api/v1/branches/:id` | ✅ | All |
| POST | `/api/v1/branches` | ✅ | Admin |
| PUT | `/api/v1/branches/:id` | ✅ | Admin, Manager |
| DELETE | `/api/v1/branches/:id` | ✅ | Admin |

### Slots
| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/api/v1/slots` | ✅ | All (scoped) |
| POST | `/api/v1/slots` | ✅ | Admin, Manager |
| PUT | `/api/v1/slots/:id` | ✅ | Admin, Manager |
| DELETE | `/api/v1/slots/:id` | ✅ | Admin, Manager |

### Appointments
| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/api/v1/appointments` | ✅ | All (scoped) |
| POST | `/api/v1/appointments` | ✅ | Admin, Manager, Customer |
| PUT | `/api/v1/appointments/:id/cancel` | ✅ | Owner / Admin / Manager |
| PUT | `/api/v1/appointments/:id/reschedule` | ✅ | Owner / Admin / Manager |
| PUT | `/api/v1/appointments/:id/complete` | ✅ | Admin, Manager, Staff |
| PUT | `/api/v1/appointments/:id/no-show` | ✅ | Admin, Manager, Staff |

### Other
| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/api/v1/service-types` | ✅ | All |
| POST | `/api/v1/staff-service-types` | ✅ | Admin, Manager |
| GET | `/api/v1/audit-logs` | ✅ | Admin only |
| GET | `/api/v1/settings` | ✅ | Admin only |
| POST | `/api/v1/uploads/id-document` | ✅ | Admin, Manager, Customer |
| POST | `/api/v1/uploads/attachment` | ✅ | Admin, Manager, Customer |

---


## 🛡️ Security Features

- **Helmet** — Sets secure HTTP headers automatically
- **CORS** — Cross-Origin Resource Sharing enabled
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **JWT Authentication** — Short-lived access tokens (15m) + refresh tokens (7d)
- **Password Hashing** — bcrypt with 12 salt rounds
- **Input Validation** — Joi schemas on every endpoint
- **SQL Injection Protection** — Parameterized queries via Knex
- **Audit Logging** — Every sensitive action is logged
