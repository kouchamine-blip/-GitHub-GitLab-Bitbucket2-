# ORUS Platform Setup Guide

## Admin Account Auto-Created

An admin account has been automatically created for you:

- **Email**: `admin@orus.com`
- **Password**: `OrusAdmin123`

You can log in immediately at http://localhost:3000/login

### Step 1: Login

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000/login

3. Enter the auto-created credentials:
   - Email: `admin@orus.com`
   - Password: `OrusAdmin123`

4. Switch language between EN/FI using the buttons in the sidebar

### Step 2: Explore the Platform

Once logged in, you'll have access to:

- **Dashboard**: Financial KPIs and revenue charts
- **Products**: Moderation queue
- **Transactions**: Commission tracking
- **Store**: Scan deposit/withdrawal codes
- **Finance**: Payout management
- **Users**: User management (Admin only) - Create ADMIN/AGENT accounts
- **Logs**: Complete audit trail (Admin only) - Filter by role and action type

## Creating Additional Users

### As Admin (Recommended)
Once logged in as admin, go to `/admin/users` to:
- Create new ADMIN or AGENT users
- Assign roles
- Manage existing users
- Delete users

### Using Seed Script
To recreate the default admin account:
```bash
npm run seed
```

This creates:
- Email: admin@orus.com
- Password: OrusAdmin123
- Role: ADMIN

## Key Features

### User Management (Admin Only)
- Create ADMIN and AGENT accounts
- Assign and modify user roles
- View all platform users
- Delete user accounts
- Password management

### Audit Logging (Admin Only)
- Filter logs by user role (All/Agent/Admin)
- Filter by action type
- Search across all log fields
- Critical actions highlighted
- Track product moderation, payout processing, and more

### Commission System
- Automatically calculates: **1€ + 7% of total**
- Example: €100 sale = €8 commission (1 + 7)

### Escrow System
- Funds held until product status = 'RETIRE' (withdrawn)
- Automatic release via database trigger
- Seller receives net amount (total - commission)

### Audit Logs
- Automatic logging of all critical actions
- Product lifecycle tracking
- Financial transaction trail
- User activity monitoring

## Database Structure

All tables are prefixed with `orus_`:
- `orus_users`: User accounts with roles and wallet
- `orus_products`: Product listings with moderation
- `orus_transactions`: Financial records with commission
- `orus_wallet_transactions`: Wallet history
- `orus_payout_requests`: Withdrawal requests
- `orus_audit_logs`: Complete activity log

## Internationalization

The platform supports:
- **English (en)**: Default
- **Finnish (fi)**: Full translation

Toggle using the EN/FI buttons in the sidebar.

## Color Scheme

Following Finnish national colors:
- **Primary Blue**: #003580 (Finland blue)
- **White**: #FFFFFF
- Clean, professional design

## Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Support

For issues or questions, check:
- Database: Supabase Dashboard
- Logs: Admin → Logs page
- Console: Browser DevTools
