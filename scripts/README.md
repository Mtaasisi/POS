# Scripts Directory

This directory contains utility scripts for the LATS CHANCE application.

## WhatsApp Diagnostics Script

### `whatsapp-diagnostics.js`

A comprehensive diagnostic tool to troubleshoot WhatsApp sending issues.

#### Usage

```bash
# Run the diagnostic script
node scripts/whatsapp-diagnostics.js

# Or if you have Node.js installed globally
./scripts/whatsapp-diagnostics.js
```

#### What it checks:

1. **Database Connection** - Verifies connection to Supabase
2. **WhatsApp Settings** - Checks if credentials are configured
3. **Connection Status** - Tests Green API connection
4. **Recent Errors** - Shows failed messages from last 24 hours
5. **Rate Limiting** - Analyzes message sending patterns
6. **Database Tables** - Verifies table accessibility

#### Prerequisites

- Node.js installed
- Environment variables set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- `.env` file in project root

#### Example Output

```
🚀 WhatsApp Diagnostics Tool
============================

🔍 Checking Database Connection...
✅ Database connection successful

🔍 Checking Database Tables...
✅ Table whatsapp_messages: Accessible
✅ Table whatsapp_chats: Accessible
✅ Table settings: Accessible

🔍 Checking WhatsApp Settings...
📋 Settings Status:
   Instance ID: ✓ Set
   API Key: ✓ Set
   API URL: Using default
   Media URL: Using default

🔍 Checking Connection Status...
📡 Connection Status: authorized
✅ WhatsApp is authorized and ready

🔍 Checking Recent Errors...
✅ No recent failed messages found

🔍 Checking Rate Limiting...
📊 Messages in last hour: 3
✅ No rapid sending detected

📋 Summary:
==========
✅ WhatsApp credentials configured

💡 Next Steps:
   1. Check the troubleshooting guide: docs/WHATSAPP_TROUBLESHOOTING.md
   2. Verify Green API credentials at green-api.com
   3. Test connection in the WhatsApp interface
   4. Check for rate limiting if sending multiple messages
```

#### Troubleshooting

If the script fails:

1. **Check environment variables** - Ensure Supabase credentials are set
2. **Verify database connection** - Check if Supabase is accessible
3. **Review error messages** - Look for specific error details
4. **Check network connectivity** - Ensure internet connection is stable

#### Related Documentation

- [WhatsApp Troubleshooting Guide](../docs/WHATSAPP_TROUBLESHOOTING.md)
- [Green API Documentation](https://green-api.com/docs/)
