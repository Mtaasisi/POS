# Production Setup Guide

## Environment Variables Setup

Create a `.env.production` file in the root directory with the following variables:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Application Configuration
VITE_LATS_DATA_MODE=supabase
VITE_APP_NAME=LATS POS System
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Production Settings
VITE_DEBUG_MODE=false
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_NOTIFICATIONS=true

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760

# WhatsApp Configuration (if using WhatsApp features)
VITE_GREEN_API_TOKEN=your_green_api_token_here
VITE_WHATSAPP_WEBHOOK_URL=https://inauzwa.store/api/whatsapp-webhook.php

# API Configuration
VITE_API_URL=https://inauzwa.store

# Email Service (Optional)
VITE_EMAIL_API_KEY=your_email_api_key_here

# AI Services (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# PWA Configuration (Optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# Performance Settings
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_CACHING=true

# Analytics (Optional)
VITE_ANALYTICS_ENABLED=false
VITE_GOOGLE_ANALYTICS_ID=

# Production Mode
NODE_ENV=production
```

## Security Checklist

- [ ] Replace `your_anon_key_here` with your actual Supabase anon key
- [ ] Replace `your_green_api_token_here` with your actual Green API token
- [ ] Replace other placeholder values with actual credentials
- [ ] Ensure `.env.production` is in `.gitignore`
- [ ] Use `config.secure.php` instead of `config.php` for production

## Build and Deploy

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Or deploy to Vercel
npx vercel --prod
```

## Database Setup

1. Ensure all migrations are applied to your production database
2. Test database connectivity
3. Verify RLS policies are working correctly

## Performance Optimization

- Enable compression on your hosting provider
- Set up CDN for static assets
- Configure caching headers
- Monitor bundle size and performance
