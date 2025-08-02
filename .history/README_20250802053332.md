# Device Repair System

A comprehensive device repair management system built with React, TypeScript, and Supabase.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   ./setup-env.sh
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

This application uses **online Supabase only**. Local Supabase has been removed from the configuration.

### Supabase Configuration
- **URL:** https://jxhzveborezjhsmzsgbc.supabase.co
- **Project ID:** jxhzveborezjhsmzsgbc

### Environment Variables
The application uses the following environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_MOBIS_USER` - SMS service username
- `VITE_MOBIS_PASSWORD` - SMS service password
- `VITE_MOBIS_SENDER_ID` - SMS sender ID

## 📊 Database Setup

To set up the database, use the Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select project: jxhzveborezjhsmzsgbc
3. Go to SQL Editor
4. Run the following scripts in order:
   - `setup_complete_database.sql`
   - `setup_spare_parts.sql`
   - `fix_sms_tables.sql`

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `./setup-env.sh` - Set up environment variables
- `./setup_database.sh` - Database setup instructions
- `./apply_sms_tables.sh` - Apply SMS tables fix

## 📁 Project Structure

```
src/
├── components/     # React components
├── pages/         # Page components
├── lib/           # Utilities and API clients
├── context/       # React contexts
├── hooks/         # Custom hooks
├── services/      # External services
└── types/         # TypeScript types
```

## 🔄 Recent Changes

- **Removed local Supabase:** The application now uses online Supabase only
- **Updated configuration:** All scripts now reference online Supabase
- **Cleaned up environment:** Removed local Supabase references from ENVs file

## 🎯 Features

- Customer management
- Device repair tracking
- SMS communication
- Payment processing
- Points/loyalty system
- Audit logging
- Inventory management
- Technician assignments

## 📝 Notes

- Local Supabase has been completely removed
- All database operations now use the online Supabase instance
- Backup and restore operations should be done through the Supabase Dashboard
- Development server runs on localhost but connects to online database
