# ZenoPay USSD PHP Server Setup Guide

## Problem Solved

The CORS error you were experiencing:
```
Access to fetch at 'http://localhost:8000/zenopay-trigger-ussd.php' from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Solution

I've created a proper PHP server setup with correct CORS headers that resolves this issue.

## Files Created

1. **`scripts/start-php-server.sh`** - PHP server management script
2. **`scripts/zenopay-trigger-ussd.php`** - USSD trigger endpoint
3. **`scripts/zenopay-ussd-popup.php`** - USSD status check endpoint

## How to Use

### 1. Start the PHP Server

```bash
# Make the script executable (if not already done)
chmod +x scripts/start-php-server.sh

# Start the PHP server
./scripts/start-php-server.sh start
```

Or manually:
```bash
cd scripts
php -S localhost:8000
```

### 2. Test the Endpoints

The server will be available at:
- **USSD Trigger**: `http://localhost:8000/zenopay-trigger-ussd.php`
- **USSD Status**: `http://localhost:8000/zenopay-ussd-popup.php`

### 3. Test with curl

```bash
# Test USSD trigger
curl -X POST "http://localhost:8000/zenopay-trigger-ussd.php" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"255746605561","amount":1000,"order_id":"TEST-123","customer_name":"Test Customer"}'

# Test USSD status check
curl -X POST "http://localhost:8000/zenopay-ussd-popup.php" \
  -H "Content-Type: application/json" \
  -d '{"order_id":"TEST-123"}'
```

## CORS Configuration

The PHP files include proper CORS headers:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## React App Integration

Your React app should now work without CORS errors. The `zenopay.ts` configuration is already set up to use:

```typescript
API_BASE_URL: 'http://localhost:8000'
```

## Server Management

```bash
# Check server status
./scripts/start-php-server.sh status

# Stop server
./scripts/start-php-server.sh stop

# Restart server
./scripts/start-php-server.sh restart
```

## Debugging

- Check the browser console for detailed logs
- Check the PHP server logs in the terminal
- USSD session data is stored in `scripts/ussd_sessions.json`
- Debug logs are written to `scripts/zenopay-ussd-debug.log`

## Next Steps

1. Start the PHP server using the script above
2. Test the USSD functionality in your React app
3. The CORS error should be resolved
4. You can now test the USSD popup functionality

## Troubleshooting

If you still get CORS errors:

1. **Check if PHP server is running**: `curl http://localhost:8000/zenopay-trigger-ussd.php`
2. **Check CORS headers**: `curl -I -X OPTIONS http://localhost:8000/zenopay-trigger-ussd.php`
3. **Restart the PHP server**: `./scripts/start-php-server.sh restart`
4. **Check browser console** for detailed error messages

## Production Setup

For production, you'll need to:
1. Deploy the PHP files to your server
2. Update the `API_BASE_URL` in `zenopay.ts` to your production server URL
3. Configure proper CORS origins instead of `*`
4. Use a proper database instead of JSON files for session storage
