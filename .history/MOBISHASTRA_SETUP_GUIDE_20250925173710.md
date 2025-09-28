# MobiShastra SMS Integration Setup Guide

## Overview
This guide will help you set up SMS functionality using MobiShastra's API with your LATS CHANCE application.

## MobiShastra API Details

### API Endpoint
- **Single SMS**: `https://mshastra.com/sendurl.aspx`
- **Multiple SMS**: `https://mshastra.com/sendurlcomma.aspx`

### Required Parameters
- `user`: Your 8-character profile ID (e.g., 200XXXXX)
- `pwd`: Your password
- `senderid`: Approved sender ID (e.g., "LATS CHANCE")
- `mobileno`: Phone number with country code
- `msgtext`: SMS message content
- `priority`: "High" (optional)
- `CountryCode`: "ALL" (optional)

### API Format
```
GET https://mshastra.com/sendurl.aspx?user=200XXXXX&pwd=your_password&senderid=LATS CHANCE&mobileno=255123456789&msgtext=Hello World&priority=High&CountryCode=ALL
```

## Setup Instructions

### Step 1: Get Your MobiShastra Credentials
1. Log into your MobiShastra account
2. Note your **Profile ID** (8-character numeric ID like 200XXXXX)
3. Note your **Password**
4. Verify your **Sender ID** is approved (e.g., "LATS CHANCE")

### Step 2: Configure Database Settings
Run this SQL in your Supabase SQL editor:

```sql
-- Update with your actual MobiShastra credentials
UPDATE settings 
SET value = '200XXXXX'  -- Replace with your actual Profile ID
WHERE key = 'sms_provider_api_key';

-- Verify the configuration
SELECT key, value FROM settings WHERE key LIKE 'sms_%';
```

### Step 3: Test SMS Functionality

#### Test Mode (Safe Testing)
Use phone number `255700000000` - this will simulate success without actually sending an SMS.

#### Real SMS Testing
Use a real phone number with country code (e.g., `255123456789` for Tanzania).

## API Response Codes

### Success Responses
- `Send Successful` - SMS sent successfully
- `000` - Send Successful (with error code API)

### Error Responses
- `Invalid Mobile No` - Invalid phone number format
- `Invalid Password` - Wrong API credentials
- `Profile Id Blocked` - Account is blocked
- `No More Credits` - Insufficient account balance
- `Invalid Profile Id` - Wrong profile ID
- `Country not activated` - Country not supported

## Phone Number Formats

MobiShastra accepts various phone number formats:
- `+255123456789` (with + and country code)
- `255123456789` (country code only)
- `0712345678` (local format - will be converted)

## Message Limits

- **English**: 160 characters = 1 SMS
- **Unicode**: 70 characters = 1 SMS
- **Long messages**: Automatically split into multiple SMS

## Testing Your Setup

### 1. Check Configuration
```sql
SELECT key, value FROM settings WHERE key LIKE 'sms_%';
```

Expected output:
```
sms_api_url: https://mshastra.com/sendurl.aspx
sms_provider_api_key: 200XXXXX (your actual profile ID)
sms_price: 15
```

### 2. Test SMS Sending
1. Go to your application's SMS Control Center
2. Try sending a test SMS to `255700000000`
3. Check browser console for success messages:
   ```
   📱 Sending SMS via backend proxy...
   ✅ SMS sent successfully via proxy
   ```

### 3. Check SMS Logs
Verify the SMS was logged in your database:
```sql
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5;
```

## Troubleshooting

### Common Issues

1. **"Invalid Password" Error**
   - Check your MobiShastra password is correct
   - Ensure no extra spaces in the password

2. **"Invalid Profile Id" Error**
   - Verify your 8-character profile ID is correct
   - Check for typos in the profile ID

3. **"No More Credits" Error**
   - Check your MobiShastra account balance
   - Top up your account if needed

4. **"Invalid Mobile No" Error**
   - Ensure phone number includes country code
   - Check phone number format is correct

### Debug Steps

1. **Check API Key Configuration**
   ```sql
   SELECT value FROM settings WHERE key = 'sms_provider_api_key';
   ```

2. **Test with MobiShastra's Test API**
   You can test directly with their API:
   ```
   https://mshastra.com/sendurl.aspx?user=YOUR_PROFILE_ID&pwd=YOUR_PASSWORD&senderid=LATS CHANCE&mobileno=255700000000&msgtext=Test&CountryCode=ALL
   ```

3. **Check Server Logs**
   Look for error messages in your server logs when SMS sending fails.

## Cost Information

- **Tanzania**: ~15 TZS per SMS
- **International**: Varies by country
- Check MobiShastra's pricing for current rates

## Advanced Features

### Scheduled SMS
Add `scheduledDate` parameter for future delivery:
```
&scheduledDate=12/25/2024 10:30 am
```

### Unicode Support
For Swahili messages, ensure proper encoding is used.

### Multiple Recipients
Use `sendurlcomma.aspx` endpoint with comma-separated phone numbers.

## Security Notes

- Keep your API credentials secure
- Never expose your password in frontend code
- Use the backend proxy (already implemented) to protect credentials
- Monitor your account usage regularly

## Support

- **MobiShastra Support**: Contact their support team for API issues
- **Application Issues**: Check the SMS logs and server logs for debugging

## Next Steps

1. ✅ Configure your actual MobiShastra credentials
2. ✅ Test with the test phone number
3. ✅ Test with real phone numbers
4. ✅ Set up SMS templates for automated notifications
5. ✅ Configure SMS triggers for device status changes
6. ✅ Monitor SMS delivery and costs

Your SMS system is now ready to use with MobiShastra!
