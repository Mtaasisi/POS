# WhatsApp Web UI Setup Guide

## Issues Found and Solutions

### 1. Database Schema Issues

**Problem**: WhatsApp database tables may not exist or have incorrect structure.

**Solution**: Run the database setup script:

```sql
-- Run this SQL script in your Supabase SQL editor
-- This will create all necessary WhatsApp tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing WhatsApp tables if they have wrong structure
DROP TABLE IF EXISTS scheduled_whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS whatsapp_autoresponders CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_chats CASCADE;

-- Create whatsapp_chats table
CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    tags TEXT[] DEFAULT '{}',
    assigned_to UUID REFERENCES auth_users(id),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location', 'contact')),
    direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    media_url TEXT,
    media_name TEXT,
    media_size INTEGER,
    media_mime_type TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other WhatsApp tables...
-- (See fix-400-errors-comprehensive.sql for complete schema)
```

### 2. Green API Configuration

**Problem**: WhatsApp Green API credentials are not configured.

**Solution**: Set up your Green API credentials:

1. Go to [Green API](https://green-api.com/) and create an account
2. Get your Instance ID and API Token
3. Add them to your settings table:

```sql
-- Insert WhatsApp settings
INSERT INTO settings (key, value) VALUES 
('whatsapp_instance_id', 'YOUR_INSTANCE_ID'),
('whatsapp_green_api_key', 'YOUR_API_TOKEN'),
('whatsapp_enable_realtime', 'true'),
('whatsapp_enable_bulk', 'true'),
('whatsapp_enable_auto', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 3. Webhook Configuration

**Problem**: Webhook handler may not be properly configured.

**Solution**: Ensure your webhook endpoint is accessible:

1. Your webhook URL should be: `https://yourdomain.com/api/whatsapp-webhook`
2. Configure this URL in your Green API dashboard
3. Make sure the webhook handler is properly deployed

### 4. Real-time Connection Issues

**Problem**: Real-time subscriptions may fail.

**Solution**: Check Supabase real-time configuration:

1. Ensure real-time is enabled in your Supabase project
2. Check that the `whatsapp_messages` table has real-time enabled
3. Verify your Supabase connection string

### 5. Error Handling Improvements

**Problem**: Generic error messages are not helpful.

**Solution**: The UI now shows specific error messages:
- Database connection errors
- API credential errors  
- Connection status issues

## Quick Fix Steps

1. **Run Database Setup**:
   ```bash
   # Copy and run the SQL from fix-400-errors-comprehensive.sql
   ```

2. **Configure Green API**:
   - Get credentials from Green API dashboard
   - Insert into settings table

3. **Test Connection**:
   - Go to WhatsApp Web UI
   - Check connection status
   - Look for error messages in the status bar

4. **Verify Webhook**:
   - Ensure webhook URL is accessible
   - Test webhook endpoint

## Common Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "WhatsApp database tables not found" | Run the database setup script |
| "WhatsApp credentials not configured" | Add Green API credentials to settings |
| "WhatsApp connection failed" | Check Green API credentials and instance status |
| "Database connection error" | Verify Supabase connection and permissions |

## Testing the Setup

1. **Check Status Bar**: Look for error messages at the top of the page
2. **Connection Status**: Should show "connected" when properly configured
3. **Load Chats**: Should display customer chats without errors
4. **Send Test Message**: Try sending a message to verify API integration

## Troubleshooting

If you still have issues:

1. Check browser console for JavaScript errors
2. Verify Supabase RLS policies are correct
3. Ensure all required tables exist
4. Test Green API connection manually
5. Check webhook logs for incoming messages

## Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your Green API instance is active and authorized
3. Ensure your Supabase project has the correct permissions
4. Test the webhook endpoint manually
