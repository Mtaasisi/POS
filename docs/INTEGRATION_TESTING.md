# Integration Testing Guide

This guide covers how to test all integrations in the LATS CHANCE app.

## Overview

The app includes comprehensive integration testing capabilities for:
- **SMS Services** (Mobishastra)
- **WhatsApp** (Green API)
- **AI Services** (Google Gemini)
- **Payment Gateways** (Beem Africa, ZenoPay)
- **Database** (Supabase)

## Testing Methods

### 1. Web Interface Testing

Access the integration testing page at: `/integration-testing`

**Features:**
- Real-time testing of all integrations
- Visual status indicators
- Detailed error messages
- Test history and results
- Connection status monitoring

**How to use:**
1. Navigate to `/integration-testing` in your app
2. Click "Initialize Defaults" to set up default integrations
3. Click "Test All" to test all integrations at once
4. Or click individual "Test" buttons for specific integrations
5. View results in the "Recent Test Results" panel

### 2. Command Line Testing

Run the testing script from the command line:

```bash
# Test all integrations
node scripts/test-integrations.cjs

# Or make it executable and run directly
chmod +x scripts/test-integrations.cjs
./scripts/test-integrations.cjs
```

**Output includes:**
- Database connection status
- Integration configuration check
- API connectivity tests
- Detailed error messages
- Summary report

## Integration Status

### ✅ Working Integrations

Based on the latest test results:

1. **Database (Supabase)** - ✅ Connected
2. **WhatsApp (Green API)** - ✅ Authorized

### ❌ Issues Found

1. **SMS (Mobishastra)** - ❌ Credentials not configured
2. **AI (Gemini)** - ❌ API model error
3. **Payment Gateways** - ❌ Not fully tested

## Troubleshooting

### SMS Integration Issues

**Problem:** "SMS credentials not configured"
**Solution:**
1. Go to Admin Settings → Integrations
2. Configure Mobishastra SMS credentials:
   - Username: `Inauzwa`
   - Password: `@Masika10`
   - Sender ID: `INAUZWA`

### WhatsApp Integration Issues

**Problem:** "WhatsApp not authorized"
**Solution:**
1. Get Green API credentials from [green-api.com](https://green-api.com)
2. Configure in Admin Settings:
   - Instance ID
   - API Key
3. Authorize your WhatsApp number

### AI Integration Issues

**Problem:** "API model error"
**Solution:**
1. Get Gemini API key from [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Update the model name in integration config
3. Verify API key has proper permissions

### Payment Integration Issues

**Problem:** Payment tests skipped
**Solution:**
1. Configure payment provider credentials
2. Set up webhook URLs
3. Test with small amounts first

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Integration Settings

Configure integrations in the database:

```sql
-- Example: Configure WhatsApp Green API
INSERT INTO integrations (name, type, provider, config, is_active)
VALUES (
  'WhatsApp Green API',
  'whatsapp',
  'green-api',
  '{"instance_id": "your_instance_id", "api_key": "your_api_key"}',
  true
);
```

## Testing Best Practices

1. **Test Regularly** - Run tests weekly to ensure integrations are working
2. **Monitor Logs** - Check error logs for integration failures
3. **Update Credentials** - Keep API keys and credentials current
4. **Test in Staging** - Always test new integrations in development first
5. **Document Changes** - Keep track of configuration changes

## Support

### Getting Help

1. **Check the logs** - Look for error messages in the browser console
2. **Test individually** - Test each integration separately to isolate issues
3. **Verify credentials** - Double-check API keys and configuration
4. **Check documentation** - Refer to provider-specific documentation

### Useful Links

- [Green API Documentation](https://green-api.com/docs/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Mobishastra SMS API](https://mshastra.com/)
- [Beem Africa API](https://docs.beem.africa/)
- [Supabase Documentation](https://supabase.com/docs)

## Quick Commands

```bash
# Test integrations
node scripts/test-integrations.cjs

# Test specific payment integration
node scripts/test-beem-integration.js

# Setup Gemini AI
node scripts/setup-gemini-ai.js

# Check database tables
node scripts/check-current-tables.js
```

## Integration Health Dashboard

The integration testing page provides a real-time health dashboard showing:

- **Connection Status** - Online/Offline indicators
- **Last Test Results** - Recent test outcomes
- **Error Details** - Specific error messages
- **Configuration Status** - Missing or invalid settings

Use this dashboard to quickly identify and resolve integration issues.
