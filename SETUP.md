# Setup Guide

## Installation

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   Note: `--legacy-peer-deps` is required due to React 19 compatibility with some packages. This is safe and won't cause issues.

2. **Environment Variables**
   
   Create `.env.local` file in the `dbod/` directory:
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
   ```bash
   cp -r ../frontend/public/* ./public/
   ```

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

## Known Issues

- Some packages use `--legacy-peer-deps` due to React 19 compatibility
- FontAwesome v0.2.x is deprecated but functional (can be updated later)
- Some npm audit warnings exist (can be addressed later)

## Project Structure

```
dbod/
├── app/
│   ├── api/              # API routes (replaces Express backend)
│   ├── (auth)/           # Protected routes
│   ├── page.tsx          # Home page
│   └── ...
├── components/            # React components
├── lib/
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database connections
│   ├── models/           # Sequelize models
│   ├── api/              # API client
│   └── utils/             # Utilities
├── services/
│   └── cron/             # Cron job service
└── public/                # Static assets
```

## API Routes

All API routes are accessible at `/api/*`:
- `/api/auth/*` - Authentication
- `/api/account` - Account info
- `/api/characters` - Character data
- `/api/donate` - Donation data
- `/api/daily-rewards/*` - Daily rewards
- `/api/raffle/*` - Raffle system
- `/api/status` - Server status
- `/api/popup-banners` - Popup banners
- `/api/create-payment-intent` - Stripe payment
- `/api/webhook` - Stripe webhook

## Next Steps

1. Copy assets from `frontend/public/` to `dbod/public/`
2. Configure environment variables in `.env.local`
3. Test all features
4. Update deprecated packages if needed
5. Address npm audit warnings
