# Development Setup Guide

## Overview

This project requires both a JavaScript/TypeScript development server (Vite) and a PHP server to run properly in development mode.

## Quick Start

### Option 1: Use the Development Script (Recommended)

```bash
# Start both servers with one command
./scripts/dev-setup.sh
```

This script will:
- Start PHP server on port 8000
- Start Vite development server on port 5173
- Test the PHP server health
- Provide cleanup on exit

### Option 2: Manual Setup

#### 1. Start PHP Server
```bash
# In one terminal
php -S localhost:8000 -t public
```

#### 2. Start Vite Development Server
```bash
# In another terminal
npm run dev
```

## Server Ports

- **Vite Development Server**: `http://localhost:5173`
- **PHP Server**: `http://localhost:8000`

## Why Two Servers?

- **Vite**: Handles React/TypeScript development with hot reload
- **PHP**: Required for WhatsApp API proxy functionality (`/api/whatsapp-proxy.php`)

## Troubleshooting

### 500 Internal Server Error on WhatsApp API

If you see this error:
```
POST http://localhost:5173/api/whatsapp-proxy.php 500 (Internal Server Error)
```

**Solution**: Make sure the PHP server is running on port 8000. The application automatically detects development mode and routes PHP requests to the correct server.

### PHP Server Not Starting

1. Check if PHP is installed:
   ```bash
   php --version
   ```

2. Check if port 8000 is available:
   ```bash
   lsof -i :8000
   ```

3. Try a different port:
   ```bash
   php -S localhost:8001 -t public
   ```
   Then update the `resolveWhatsAppProxyUrl` function in `src/lib/whatsappSettingsApi.ts`

### CORS Issues

The PHP server includes CORS headers, but if you encounter issues, check:
- Both servers are running
- The correct URLs are being used
- Browser console for specific error messages

## Production Deployment

In production, the PHP files are served by the web server (Apache/Nginx), so only one server is needed. The application automatically detects production mode and uses the correct URLs.
