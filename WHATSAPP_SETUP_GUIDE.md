# WhatsApp Integration Setup Guide

## Overview
This guide explains how to set up and run the WhatsApp integration for local development.

## Prerequisites
- Node.js 18+ installed
- Netlify CLI installed globally (`npm install -g netlify-cli`)
- WhatsApp Business API credentials (Green API)

## Quick Start

### 1. Start Development Environment
```bash
# Option 1: Use the convenience script (recommended)
npm run dev:netlify

# Option 2: Start manually
netlify dev --port 8888 &
npm run dev
```

### 2. Verify WhatsApp Connection
```bash
node scripts/test-whatsapp-connection-local.js
```

## Architecture

### Local Development Setup
- **Vite Dev Server**: Runs on `http://localhost:5173`
- **Netlify Functions**: Run on `http://localhost:8888`
- **WhatsApp Proxy**: `http://localhost:8888/.netlify/functions/whatsapp-proxy`

### Production Setup
- **Netlify Functions**: Deployed to Netlify
- **WhatsApp Proxy**: Available at `/.netlify/functions/whatsapp-proxy`

## WhatsApp API Configuration

### Credentials
The WhatsApp integration uses Green API with these credentials:
- **Instance ID**: `7105284900`
- **API Token**: `b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294`
- **API URL**: `https://7105.api.greenapi.com`

### Supported Actions
The WhatsApp proxy supports these actions:

1. **getStateInstance** - Check if WhatsApp is connected
2. **getWebhookSettings** - Get webhook configuration
3. **sendMessage** - Send a text message
4. **getQRCode** - Get QR code for authentication

## Troubleshooting

### Connection Refused Error
If you see `net::ERR_CONNECTION_REFUSED`:

1. **Check if Netlify functions are running**:
   ```bash
   curl http://localhost:8888/.netlify/functions/health
   ```

2. **Start Netlify functions**:
   ```bash
   netlify dev --port 8888
   ```

3. **Verify port availability**:
   ```bash
   lsof -i :8888
   ```

### WhatsApp Not Authorized
If WhatsApp shows as not authorized:

1. **Get QR Code**:
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/whatsapp-proxy \
     -H "Content-Type: application/json" \
     -d '{"action":"getQRCode"}'
   ```

2. **Scan QR code with WhatsApp**
3. **Check status again**:
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/whatsapp-proxy \
     -H "Content-Type: application/json" \
     -d '{"action":"getStateInstance"}'
   ```

### Test Message Sending
```bash
curl -X POST http://localhost:8888/.netlify/functions/whatsapp-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sendMessage",
    "data": {
      "chatId": "255746605561@c.us",
      "message": "Test message from local development"
    }
  }'
```

## Development Workflow

### 1. Start Development Environment
```bash
npm run dev:netlify
```

### 2. Open Application
Navigate to `http://localhost:5173`

### 3. Test WhatsApp Features
- Go to WhatsApp Management page
- Check connection status
- Send test messages
- Test auto-reply functionality

### 4. Monitor Logs
Watch the terminal for:
- Netlify function logs
- Vite dev server logs
- WhatsApp API responses

## File Structure

```
netlify/functions/
├── whatsapp-proxy.js      # Main WhatsApp proxy function
├── whatsapp-webhook.js    # Webhook handler
├── health.js             # Health check endpoint
└── package.json          # Function dependencies

scripts/
├── test-whatsapp-connection-local.js  # Local connection test
├── test-auto-reply.js                 # Auto-reply test
└── start-dev.sh                       # Development startup script
```

## Environment Variables

No additional environment variables are needed for local development. The WhatsApp credentials are hardcoded in the proxy function for simplicity.

## Deployment

When deploying to production:

1. **Netlify Functions**: Automatically deployed with the site
2. **Environment Variables**: Set in Netlify dashboard if needed
3. **Webhook URLs**: Update to production URLs

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the connection test script
3. Check Netlify function logs
4. Verify WhatsApp API credentials are valid
