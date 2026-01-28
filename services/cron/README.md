# Cron Service

This is a separate Node.js service for handling cron jobs that need to run continuously.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with database configuration (same as main app)

3. Run the service:
```bash
node index.js
```

## Features

- Raffle timer (checks every minute)
- Daily raffle creation (midnight)
- Server status updates (every minute)
- Game server socket connection

## Note

This service should run as a separate process alongside the Next.js application.
