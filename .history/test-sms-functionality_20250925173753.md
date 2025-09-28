# Test SMS Functionality - MobiShastra Integration

## Your MobiShastra Credentials
- **Profile ID**: `Inauzwa`
- **Password**: `@Masika10`
- **Sender ID**: `INAUZWA`

## Setup Steps

### 1. Run the Configuration Script
Execute `setup-mobishastra-credentials.sql` in your Supabase SQL editor to configure your credentials.

### 2. Test SMS Functionality

#### Test Mode (Safe - No Real SMS Sent)
Use phone number: `255700000000`
- This will simulate success without actually sending an SMS
- Perfect for testing the integration

#### Real SMS Test
Use a real phone number: `255123456789` (replace with actual number)
- This will send a real SMS to the number
- Make sure you have credits in your MobiShastra account

## Expected API Request Format

Your SMS will be sent using this MobiShastra API format:
```
GET https://mshastra.com/sendurl.aspx?user=Inauzwa&pwd=@Masika10&senderid=INAUZWA&mobileno=255123456789&msgtext=Your Message&priority=High&CountryCode=ALL
```

## Testing in Your Application

1. **Go to SMS Control Center** in your application
2. **Try sending a test SMS** to `255700000000`
3. **Check browser console** for these messages:
   ```
   📱 Sending SMS via backend proxy...
   ✅ SMS sent successfully via proxy
   ```

## Expected Responses

### Success Response
- `Send Successful` - SMS sent successfully
- `000` - Send Successful (with error code)

### Error Responses
- `Invalid Mobile No` - Check phone number format
- `Invalid Password` - Check your password `@Masika10`
- `No More Credits` - Top up your MobiShastra account
- `Profile Id Blocked` - Contact MobiShastra support

## Verification Steps

### 1. Check Database Configuration
```sql
SELECT key, value FROM settings WHERE key LIKE 'sms_%';
```

Expected output:
```
sms_api_url: https://mshastra.com/sendurl.aspx
sms_provider_api_key: Inauzwa
sms_price: 15
```

### 2. Check SMS Logs
```sql
SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT 5;
```

### 3. Test with Different Phone Formats
MobiShastra accepts various formats:
- `255123456789` (with country code)
- `+255123456789` (with + and country code)
- `0712345678` (local format)

## Troubleshooting

### If SMS Fails
1. **Check your MobiShastra account balance**
2. **Verify the phone number format**
3. **Check browser console for error messages**
4. **Verify database settings are correct**

### Common Issues
- **"Invalid Password"**: Make sure password is exactly `@Masika10`
- **"No More Credits"**: Top up your MobiShastra account
- **"Invalid Mobile No"**: Use proper phone number format with country code

## Next Steps After Testing

1. ✅ Test with `255700000000` (test mode)
2. ✅ Test with real phone number
3. ✅ Set up SMS templates for automated notifications
4. ✅ Configure SMS triggers for device status changes
5. ✅ Monitor SMS delivery and costs

Your MobiShastra SMS integration is now ready to use!
