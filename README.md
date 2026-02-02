# Mandalay School Management

This project is Dockerized for easy multi-device development.

## Project Structure
- `web-app/`: The Next.js web application.

## Prerequisites
- Docker Desktop
- Node.js (v18+)

## How to Run (Development)

### Using Docker (Multi-device)
1. Ensure your `.env.local` file is present in the `web-app/` directory.
2. Run:
   ```bash
   cd web-app
   docker compose up --build
   ```
3. Access: `http://localhost:3000`

### Using Local Node.js
1. Run:
   ```bash
   cd web-app
   npm install
   npm run dev
   ```
2. Access: `http://localhost:3000`

## Multi-device Sync via GitHub
Always `git commit` and `git push` before switching devices.
On the new device, run `git pull` to get the latest changes.
