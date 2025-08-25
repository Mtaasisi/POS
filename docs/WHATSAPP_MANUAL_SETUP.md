# WhatsApp Manual Setup Guide

This guide explains how to manually configure your WhatsApp Green API credentials for production use.

## Overview

The WhatsApp integration has been updated to support manual credential configuration. Instead of using hardcoded credentials, you can now:

1. **Configure your own Green API credentials**
2. **Test credentials before saving**
3. **Manage settings through the application dashboard**
4. **Use different credentials for different environments**

## Prerequisites

1. **Green API Account**: Sign up at [https://green-api.com](https://green-api.com)
2. **WhatsApp Business Account** (optional but recommended)
3. **Phone Number**: A dedicated phone number for WhatsApp integration
4. **API Token**: Get your API token from Green API dashboard

## Setup Methods

### Method 1: Using the Setup Script (Recommended)

1. **Run the setup script**:
   ```bash
   node scripts/setup-whatsapp-credentials.js
   ```

2. **Follow the interactive prompts**:
   - Enter your Instance ID
   - Enter your API Token
   - Enter your API URL (default: https://api.greenapi.com)
   - Enter Media URL (optional)
   - Enter allowed phone numbers (optional)

3. **The script will**:
   - Validate your credentials
   - Test the connection
   - Save settings to the database
   - Provide a summary

### Method 2: Using the Application Dashboard

1. **Navigate to WhatsApp Settings**:
   - Go to your application dashboard
   - Find the WhatsApp settings section
   - Click on "Configure WhatsApp"

2. **Enter your credentials**:
   - **Instance ID**: Your Green API instance ID
   - **API Token**: Your Green API token
   - **API URL**: Your Green API URL (usually https://api.greenapi.com)
   - **Media URL**: Optional media API URL

3. **Test your credentials**:
   - Click "Test Credentials" to verify they work
   - Check the instance state (should be "authorized")

4. **Save settings**:
   - Click "Save Settings" to store in database
   - Settings will be automatically synced

### Method 3: Direct Database Configuration

1. **Access your database** (Supabase dashboard or direct connection)

2. **Insert/Update settings**:
   ```sql
   INSERT INTO settings (key, value) VALUES
   ('whatsapp.instanceId', 'your-instance-id'),
   ('whatsapp.apiToken', 'your-api-token'),
   ('whatsapp.apiUrl', 'https://api.greenapi.com'),
   ('whatsapp.mediaUrl', 'https://media.greenapi.com'),
   ('whatsapp.allowedNumbers', '[]'),
   ('whatsapp.quota', '{"monthlyLimit": "Unknown", "upgradeRequired": false, "upgradeUrl": "https://console.green-api.com"}')
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
   ```

## Getting Your Green API Credentials

### Step 1: Create a Green API Account

1. Go to [https://green-api.com](https://green-api.com)
2. Sign up for an account
3. Verify your email

### Step 2: Create an Instance

1. **Log into Green API Console**
2. **Click "Create Instance"**
3. **Choose instance type**:
   - **Free**: Limited messages per month
   - **Paid**: Unlimited messages

### Step 3: Get Your Credentials

1. **Instance ID**: Found in your instance details
2. **API Token**: Generated when you create the instance
3. **API URL**: Usually `https://api.greenapi.com`

### Step 4: Authorize WhatsApp

1. **Scan QR Code**: Use the QR code in your instance
2. **Wait for Authorization**: Status should change to "authorized"
3. **Test Connection**: Use the test button in the dashboard

## Configuration Options

### Basic Settings

- **Instance ID**: Your Green API instance identifier
- **API Token**: Your authentication token
- **API URL**: Base URL for API calls
- **Media URL**: URL for media operations (optional)

### Advanced Settings

- **Allowed Numbers**: Restrict messaging to specific numbers
- **Webhook URL**: For receiving incoming messages
- **Quota Settings**: Manage usage limits

## Testing Your Configuration

### 1. Test Credentials

Use the "Test Credentials" button in the dashboard to verify:
- ✅ Credentials are valid
- ✅ Instance is authorized
- ✅ API connection works

### 2. Test Message Sending

Send a test message to verify:
- ✅ Message is delivered
- ✅ Status updates work
- ✅ Error handling works

### 3. Test Webhook (if configured)

Verify webhook functionality:
- ✅ Incoming messages are received
- ✅ Webhook URL is accessible
- ✅ Message processing works

## Troubleshooting

### Common Issues

#### 1. "Credentials not configured" Error

**Solution**: Run the setup script or configure credentials in the dashboard

#### 2. "Instance not authorized" Error

**Solution**: 
- Scan the QR code in Green API console
- Wait for authorization to complete
- Check instance status

#### 3. "API call failed" Error

**Solution**:
- Verify Instance ID and API Token
- Check API URL format
- Ensure instance is active

#### 4. "Rate limit exceeded" Error

**Solution**:
- Upgrade your Green API plan
- Implement rate limiting
- Check message quotas

### Debug Steps

1. **Check Instance Status**:
   ```bash
   curl "https://api.greenapi.com/waInstance{YOUR_INSTANCE_ID}/getStateInstance/{YOUR_API_TOKEN}"
   ```

2. **Test API Connection**:
   ```bash
   curl "https://api.greenapi.com/waInstance{YOUR_INSTANCE_ID}/getSettings/{YOUR_API_TOKEN}"
   ```

3. **Check Application Logs**:
   - Review browser console
   - Check server logs
   - Monitor network requests

## Security Considerations

### 1. API Token Security

- ✅ Store tokens in database (not in code)
- ✅ Use environment variables for sensitive data
- ✅ Rotate tokens regularly
- ❌ Never commit tokens to version control

### 2. Access Control

- ✅ Restrict access to WhatsApp settings
- ✅ Use role-based permissions
- ✅ Audit credential changes

### 3. Network Security

- ✅ Use HTTPS for all API calls
- ✅ Validate webhook URLs
- ✅ Implement rate limiting

## Environment Variables

For advanced configuration, you can set these environment variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp Configuration (optional, overrides database)
GREENAPI_INSTANCE_ID=your_instance_id
GREENAPI_API_TOKEN=your_api_token
GREENAPI_API_URL=https://api.greenapi.com
```

## Migration from Hardcoded Credentials

If you're upgrading from the old hardcoded system:

1. **Backup current settings** (if any)
2. **Run the setup script** to configure new credentials
3. **Test the new configuration**
4. **Update any custom scripts** to use the new system
5. **Remove old hardcoded credentials** from your codebase

## Support

### Documentation

- [Green API Documentation](https://green-api.com/docs/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Application Documentation](./README.md)

### Getting Help

1. **Check the troubleshooting section** above
2. **Review application logs** for error details
3. **Test with Green API console** directly
4. **Contact support** with specific error messages

## Next Steps

After setting up your credentials:

1. **Configure webhooks** for receiving messages
2. **Set up message templates** for business use
3. **Implement message handling** logic
4. **Test with real phone numbers**
5. **Monitor usage and quotas**

---

**Note**: This manual setup replaces the previous hardcoded credential system. All new deployments should use this manual configuration approach for better security and flexibility.
