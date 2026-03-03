# FlowCare — Docker Deployment Guide

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed
- [Docker Compose](https://docs.docker.com/compose/) installed (included with Docker Desktop)

---

## 🚀 Quick Start (One Command)

```bash
# From the project root directory:
docker-compose -f docker/docker-compose.yml up --build
```

This will:
1. Start a PostgreSQL 16 database container
2. Build the FlowCare API image
3. Wait for the database to be healthy
4. Run all migrations (create tables)
5. Run seed data (test users, branches, etc.)
6. Start the API server on port 3000

✅ **API available at:** `http://localhost:3000`
✅ **Health check:** `http://localhost:3000/api/v1/health`

---

## 📌 Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose -f docker/docker-compose.yml up --build` | Build and start all containers |
| `docker-compose -f docker/docker-compose.yml up -d` | Start in background (detached) |
| `docker-compose -f docker/docker-compose.yml down` | Stop containers (keep data) |
| `docker-compose -f docker/docker-compose.yml down -v` | Stop containers + delete database |
| `docker-compose -f docker/docker-compose.yml logs -f api` | View API logs |
| `docker-compose -f docker/docker-compose.yml logs -f postgres` | View database logs |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Docker Compose               │
│                                         │
│  ┌──────────────┐   ┌───────────────┐   │
│  │ flowcare-api │   │  postgres     │   │
│  │ (Node.js)    │──▶│  (PostgreSQL) │   │
│  │ Port: 3000   │   │  Port: 5432   │   │
│  └──────────────┘   └───────┬───────┘   │
│                             │           │
│                      ┌──────┴──────┐    │
│                      │  pgdata     │    │
│                      │  (volume)   │    │
│                      └─────────────┘    │
└─────────────────────────────────────────┘
```

---

## 🌐 Cloud Deployment (Render.com)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Abdulmnom/Backend_FlowCare.git
git push -u origin main
```

if thereare any conflicts, resolve them and push again. 
or user 
''' bash
Remove-Item -Recurse -Force .git
### Step 2: Create PostgreSQL on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Name: `flowcare-db`
4. Plan: **Free**
5. Click **Create Database**
6. Copy the **Internal Database URL**

### Step 3: Deploy the API on Render

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `flowcare-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npx knex migrate:latest --knexfile knexfile.js && npx knex seed:run --knexfile knexfile.js && node src/server.js`
4. Add **Environment Variables:**
   - `NODE_ENV` = `production`
   - `DB_HOST` = (from Render PostgreSQL)
   - `DB_PORT` = `5432`
   - `DB_NAME` = (from Render PostgreSQL)
   - `DB_USER` = (from Render PostgreSQL)
   - `DB_PASSWORD` = (from Render PostgreSQL)
   - `JWT_SECRET` = (generate a strong secret)
   - `JWT_REFRESH_SECRET` = (generate another strong secret)
   - `JWT_EXPIRES_IN` = `15m`
   - `JWT_REFRESH_EXPIRES_IN` = `7d`
   - `UPLOAD_DIR` = `./uploads`
   - `MAX_FILE_SIZE` = `5242880`
   - `LOG_LEVEL` = `info`
5. Click **Create Web Service**

Your live API URL will be: `https://flowcare-api.onrender.com`

---

## 👥 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@flowcare.om` | `Password123!` | Admin |
| `manager.muscat@flowcare.om` | `Password123!` | Branch Manager |
| `mohammed@customer.com` | `Password123!` | Customer |

---

## 🗂️ Files in this folder

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds the Node.js API container image |
| `.dockerignore` | Excludes unnecessary files from the image |
| `docker-compose.yml` | Orchestrates API + PostgreSQL containers |
| `README.md` | This deployment guide |
