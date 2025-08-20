# WhatsApp Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to send via WhatsApp" Error

#### Possible Causes:
- **Missing or incorrect credentials**
- **WhatsApp not authorized**
- **Rate limiting**
- **Invalid phone number format**
- **Network connectivity issues**

#### Quick Diagnostic Steps:

1. **Check WhatsApp Configuration**
   - Go to WhatsApp settings (gear icon)
   - Verify Instance ID and API Key are set
   - Test connection using "Test Connection" button

2. **Run Diagnostics**
   - Click "Run Diagnostics" button in error message
   - Review connection status, settings, and rate limit info
   - Follow recommendations provided

3. **Check Connection Status**
   - Look for connection indicator in top-right corner
   - Should show "connected" (green) status
   - If "disconnected" (red), check settings

### 2. Credentials Not Configured

#### Symptoms:
- Error: "WhatsApp credentials not configured"
- Settings show "✗ Not set" for Instance ID or API Key

#### Solution:
1. **Get Green API Credentials:**
   - Visit [green-api.com](https://green-api.com)
   - Create account and log in
   - Create new WhatsApp instance
   - Copy Instance ID and API Token

2. **Configure in App:**
   - Open WhatsApp settings
   - Enter Instance ID and API Key
   - Click "Test Connection"
   - Save configuration

3. **Authorize WhatsApp:**
   - Scan QR code with WhatsApp Business app
   - Wait for authorization confirmation

### 3. Rate Limiting Issues

#### Symptoms:
- Error: "Rate limit exceeded"
- Messages fail after sending several in quick succession
- Diagnostic shows rate limit backoff time

#### Solution:
1. **Wait for Rate Limit to Expire**
   - Check diagnostic info for backoff time
   - Wait until rate limit expires
   - Reduce message frequency

2. **Optimize Sending:**
   - Send messages with 30+ second intervals
   - Use bulk messaging sparingly
   - Monitor rate limit status

### 4. Invalid Phone Number Format

#### Symptoms:
- Error: "Invalid phone number format"
- Messages fail for specific contacts

#### Solution:
1. **Use International Format:**
   - Format: `254700000000` (Kenya example)
   - Include country code without `+` or spaces
   - Remove any special characters

2. **Update Contact Information:**
   - Edit customer phone numbers
   - Ensure proper international format
   - Test with valid number

### 5. WhatsApp Not Authorized

#### Symptoms:
- Error: "WhatsApp not authorized"
- Connection status shows "not_authorized"

#### Solution:
1. **Scan QR Code:**
   - Open WhatsApp settings
   - Click "Test Connection"
   - Scan QR code with WhatsApp Business
   - Wait for authorization

2. **Check WhatsApp Business:**
   - Ensure WhatsApp Business is active
   - Verify phone number matches
   - Check for any restrictions

### 6. Network Connectivity Issues

#### Symptoms:
- Error: "Network connection issue"
- Connection status shows "connection_error"

#### Solution:
1. **Check Internet Connection:**
   - Verify stable internet connection
   - Test other online services
   - Check firewall settings

2. **API Endpoint Issues:**
   - Green API service might be down
   - Check [Green API Status](https://green-api.com)
   - Wait and retry later

## Advanced Troubleshooting

### Diagnostic Information

When you run diagnostics, you'll see:

1. **Connection Status:**
   - `authorized`: WhatsApp is properly connected
   - `not_authorized`: Need to scan QR code
   - `blocked`: Account is blocked
   - `connection_error`: Network issues

2. **Settings Status:**
   - Instance ID: ✓ Set or ✗ Not set
   - API Key: ✓ Set or ✗ Not set

3. **Rate Limit Info:**
   - Error count
   - Last error message
   - Rate limit backoff time

### Error Message Decoding

The app provides user-friendly error messages:

- **Rate limit exceeded**: Wait before sending more messages
- **Not authorized**: Scan QR code to authorize WhatsApp
- **Invalid phone number**: Use international format
- **Credentials not configured**: Set up Green API credentials
- **Network issue**: Check internet connection

### Best Practices

1. **Message Sending:**
   - Send messages with intervals (30+ seconds)
   - Use bulk messaging during off-peak hours
   - Monitor rate limit status

2. **Contact Management:**
   - Use international phone number format
   - Keep contact information updated
   - Test with valid numbers

3. **System Maintenance:**
   - Regularly check connection status
   - Monitor diagnostic information
   - Update credentials if needed

## Getting Help

If you continue experiencing issues:

1. **Run Diagnostics** and note the results
2. **Check Green API Status** at their website
3. **Review Error Messages** for specific guidance
4. **Contact Support** with diagnostic information

## Technical Details

### API Endpoints Used:
- Connection check: `https://api.green-api.com/waInstance{id}/getStateInstance/{token}`
- Send message: `https://api.green-api.com/waInstance{id}/sendMessage/{token}`
- Upload media: `https://media.green-api.com/waInstance{id}/uploadFile/{token}`

### Rate Limits:
- Default: 30 seconds between API calls
- Rate limit backoff: Exponential (up to 10 minutes)
- Bulk messaging: Use with caution

### Phone Number Format:
- Required: International format without `+`
- Example: `254700000000` (Kenya)
- Must be valid WhatsApp number
