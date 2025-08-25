# Green-API QR Code Authorization Guide

## 📱 Overview

This guide explains how to use Green-API QR codes to authorize your WhatsApp instance in the LATS CHANCE application. Your current setup uses Green-API for WhatsApp integration, and this guide covers when and how to use QR code authorization.

## ✅ Current Status

Your WhatsApp instance is currently **authorized**:
- **Instance ID**: `7105284900`
- **API Token**: `b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294`
- **API URL**: `https://7105.api.greenapi.com`
- **Status**: `authorized` ✅

## 🔄 When You Need QR Code Authorization

### 1. **Instance Logout**
If your instance gets logged out, you'll need to re-authorize:
```bash
# Check current status
node scripts/reauthorize-whatsapp.js

# Force logout and re-authorize
node scripts/reauthorize-whatsapp.js --force
```

### 2. **New Instance Setup**
When creating a new WhatsApp instance in Green-API console.

### 3. **Device Changes**
When switching phones or reinstalling WhatsApp Business app.

### 4. **Security Issues**
If your instance gets blocked or suspended.

## 🛠️ Available Tools

### 1. **Command Line Script**
```bash
# Check instance status
node scripts/reauthorize-whatsapp.js

# Logout and get new QR code
node scripts/reauthorize-whatsapp.js --logout

# Force re-authorization
node scripts/reauthorize-whatsapp.js --force
```

### 2. **Web Interface**
Access the WhatsApp Management page in your app:
- Navigate to WhatsApp Management
- Go to "Authorization" tab
- Use the QR code component

### 3. **Direct API Calls**
```bash
# Get QR code directly
curl "https://7105.api.greenapi.com/waInstance7105284900/qr/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"

# Check instance status
curl "https://7105.api.greenapi.com/waInstance7105284900/getStateInstance/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"
```

## 📱 QR Code Process

### Step 1: Get QR Code
```javascript
// API Endpoint
GET https://api.green-api.com/waInstance{idInstance}/qr/{apiTokenInstance}

// Your specific endpoint
GET https://7105.api.greenapi.com/waInstance7105284900/qr/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294
```

### Step 2: Response Types
```json
// Success - QR Code received
{
  "type": "qrCode",
  "message": "base64_encoded_qr_code_image"
}

// Already authorized
{
  "type": "alreadyLogged",
  "message": "instance account already authorized"
}

// Error occurred
{
  "type": "error",
  "message": "Error description"
}
```

### Step 3: Display QR Code
```html
<!-- For web display -->
<img src="data:image/png;base64,{qrCode}" alt="WhatsApp QR Code" />

<!-- Direct URL (Green-API provides) -->
https://qr.green-api.com/waInstance7105284900/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294
```

### Step 4: Scan with WhatsApp
1. Open WhatsApp Business app
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code
5. Wait for authorization confirmation

## ⏰ Important Timing

- **QR Code Expiry**: 20 seconds
- **Refresh Interval**: Request new QR code every 1 second if needed
- **Authorization Check**: Poll status every 2-3 seconds
- **Timeout**: Up to 10 minutes for authorization

## 🔧 Integration with Your App

### React Component Usage
```tsx
import { WhatsAppQRCode } from '../components/WhatsAppQRCode';

<WhatsAppQRCode
  instanceId="7105284900"
  apiToken="b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"
  apiUrl="https://7105.api.greenapi.com"
  onAuthorized={() => console.log('WhatsApp authorized!')}
/>
```

### Management Page
Access the WhatsApp Management page in your app:
- **Overview**: Current status and statistics
- **Authorization**: QR code interface
- **Settings**: Configuration details
- **Testing**: Send test messages

## 🚨 Troubleshooting

### Issue: "Instance already authorized"
**Solution**: Your instance is already connected. No QR code needed.

### Issue: "QR code not generating"
**Solution**: 
1. Check if instance is logged out
2. Verify API credentials
3. Try the logout command first

### Issue: "QR code expires too quickly"
**Solution**: 
- QR codes expire every 20 seconds
- Use auto-refresh functionality
- Request new QR code if needed

### Issue: "Authorization not completing"
**Solution**:
1. Ensure WhatsApp Business app is up to date
2. Check internet connection
3. Try logging out and back in
4. Clear WhatsApp cache if needed

## 📊 Monitoring

### Check Instance Status
```bash
# Command line
node scripts/check-green-api-status.js

# API call
curl "https://7105.api.greenapi.com/waInstance7105284900/getStateInstance/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"
```

### View Logs
```bash
# Check Green-API logs
node scripts/check-green-api-logs.js
```

### Web Interface
- Go to WhatsApp Management page
- Check "Overview" tab for real-time status
- Monitor "Authorization" tab for QR code status

## 🔐 Security Considerations

### API Token Security
- Keep your API token secure
- Don't expose it in client-side code
- Use environment variables
- Rotate tokens regularly

### Instance Management
- Monitor instance status regularly
- Logout unused instances
- Keep track of authorized devices
- Review Green-API console logs

## 📞 Support

### Green-API Support
- **Documentation**: https://green-api.com/en/docs/
- **Console**: https://console.green-api.com
- **Support**: Available through Green-API dashboard

### Your App Support
- Check the WhatsApp Management page
- Use the verification scripts
- Review the logs and error messages
- Contact your development team

## 🎯 Best Practices

1. **Regular Monitoring**: Check instance status daily
2. **Backup Authorization**: Keep QR code process documented
3. **Test Regularly**: Send test messages to verify functionality
4. **Update Credentials**: Keep API tokens and instance info current
5. **Monitor Quota**: Watch your Green-API usage limits

## ✅ Success Checklist

- [ ] Instance status is "authorized"
- [ ] QR code generates successfully (when needed)
- [ ] WhatsApp Business app can scan QR code
- [ ] Authorization completes within 10 minutes
- [ ] Test messages can be sent
- [ ] Webhook receives incoming messages
- [ ] Management page shows correct status
- [ ] All verification scripts pass

---

**Your WhatsApp integration is ready when all items are checked!** 🎉

For more information, refer to the [Green-API QR Code Documentation](https://green-api.com/en/docs/api/account/QR/).
