# LATS POS System

A comprehensive Point of Sale (POS) system built with React, TypeScript, and Supabase for device repair and retail management.

## Features

### 🛒 POS System
- Mobile-optimized POS interface
- Product search and management
- Multiple payment methods (Cash, Mobile Money, Bank Transfer)
- Receipt generation and printing
- Discount management
- Inventory tracking

### 📱 Mobile Support
- Android APK build support
- Touch-optimized interface
- Virtual keyboard for mobile devices
- Responsive design

### 🏪 Inventory Management
- Product catalog with variants
- Stock tracking and adjustments
- Storage room management
- Category management
- Product specifications
- Image upload and management

### 💰 Payment Tracking
- Multiple payment providers
- Payment reconciliation
- Transaction history
- Payment analytics

### 🔧 Device Repair Management
- Device tracking and status updates
- Diagnostic checklists
- Repair workflow management
- Customer communication

### 👥 Customer Management
- Customer database
- Loyalty programs
- Communication tracking
- Purchase history

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Mobile**: Capacitor for Android
- **Build Tool**: Vite
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LATS-POS-GitHub-Upload
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.template .env
# Edit .env with your Supabase credentials
```

4. Run the development server:
```bash
npm run dev
```

### Build Commands

- **Web Build**: `npm run build`
- **POS Build**: `npm run build:pos`
- **Android Build**: `npm run android:build`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-specific components
│   ├── lats/          # POS and inventory features
│   ├── customers/     # Customer management
│   ├── devices/       # Device repair features
│   └── payments/      # Payment processing
├── lib/               # API services and utilities
├── hooks/             # Custom React hooks
├── services/          # External service integrations
└── types/             # TypeScript type definitions

public/                # Static assets
supabase/             # Database migrations and functions
android/              # Android app configuration
```

## Database

The system uses Supabase (PostgreSQL) with the following main tables:
- `lats_products` - Product catalog
- `lats_sales` - Sales transactions
- `customers` - Customer information
- `devices` - Device repair tracking
- `payment_providers` - Payment method configuration

## Mobile App

To build the Android APK:

1. Install Android Studio and set up the Android SDK
2. Run: `npm run android:build`
3. The APK will be generated in `android/app/build/outputs/apk/debug/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for LATS business operations.

## Support

For technical support or questions, contact the development team.
