# DBOD Next.js Application

This is the migrated Next.js application consolidating the Express backend and React frontend.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env.local` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=123456
   DB_NAME=dbo

   # Account Database
   DB_ACC_HOST=localhost
   DB_ACC_USER=root
   DB_ACC_PASSWORD=123456
   DB_ACC_NAME=dbo_acc

   # Character Database
   DB_CHAR_HOST=localhost
   DB_CHAR_USER=root
   DB_CHAR_PASSWORD=123456
   DB_CHAR_NAME=dbo_char

   # JWT Configuration
   JWT_TOKEN=*nO&7&KKchdkVu!V9@U$%7B9@C3m1zrHNN#mt$rv4AGU7pI5#v

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Copy Assets**
   Copy all files from `../frontend/public/` to `./public/`

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Run Cron Service** (separate terminal)
   ```bash
   cd services/cron
   npm install
   node index.js
   ```

## Project Structure

```
dbod/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Protected routes
│   ├── page.tsx           # Home page
│   └── ...
├── components/             # React components
├── lib/                   # Utilities and shared code
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database connections
│   ├── models/           # Sequelize models
│   ├── api/              # API client
│   └── utils/            # Utility functions
├── services/              # External services
│   └── cron/             # Cron job service
└── public/                # Static assets
```

## Features

- ✅ Authentication (Login, Register, Logout)
- ✅ User Panel (Profile, Characters, Donations)
- ✅ Donation System with Stripe Integration
- ✅ Daily Login Rewards
- ✅ Daily Raffle
- ✅ Server Status
- ✅ Popup Banners

## API Routes

All API routes are prefixed with `/api/`:
- `/api/auth/*` - Authentication endpoints
- `/api/account` - Account information
- `/api/characters` - Character data
- `/api/donate` - Donation data
- `/api/daily-rewards/*` - Daily rewards
- `/api/raffle/*` - Raffle system
- `/api/status` - Server status
- `/api/popup-banners` - Popup banners

## Notes

- The cron service should run as a separate process
- WebSocket connections are handled by the cron service
- All authentication uses JWT tokens stored in cookies
- Database connections use connection pooling for serverless compatibility
