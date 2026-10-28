# Vehicle Inspection Dashboard - Server (Backend)

Express + TypeScript backend service interfacing with Google Sheets API to fetch and cache vehicle inspection records.

## Features
- Google Sheets API integration via Service Account credentials
- In-memory caching with 5-minute TTL and manual force-refresh support
- RESTful API endpoints with full CORS support

## API Endpoints
- `GET /api/health` - Server and Google Sheets connection health check
- `GET /api/inspections` - Fetch inspection records with optional `?search=...`, `?status=...`, `?forceRefresh=true`
- `GET /api/inspections/stats` - Aggregated metrics & chart datasets

## Setup & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   GOOGLE_SHEET_ID=1gyuhg7Gx84acLtbZed506b4wOW8R31Cmn2p6VZVFxWs
   GOOGLE_SHEET_NAME=Inspection Request
   GOOGLE_PROJECT_ID=dashboard-512907
   GOOGLE_CLIENT_EMAIL=sheets-qa@dashboard-512907.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. Build and start in production:
   ```bash
   npm run build
   npm start
   ```

## Deploying Backend

Because this is a persistent Node.js Express server, it is best deployed on platforms like **Render**, **Railway**, **Fly.io**, or **Heroku**:

### Deploying on Render (Recommended Free Option):
1. Push this folder to a new GitHub repository (e.g. `assigment-01-server`).
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Select your server repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_NAME`
   - `GOOGLE_PROJECT_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `PORT`: `5000` (or leave default assigned by Render)
6. Once deployed, copy your Render service URL (e.g., `https://assigment-01-server.onrender.com`) and paste it as `VITE_API_BASE_URL` in your frontend client deployment on Vercel.
