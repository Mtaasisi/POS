# WhatsApp Business API Webhook Troubleshooting Guide

## Error: "The callback URL or verify token couldn't be validated"

This error occurs when setting up the webhook in Meta Developer Console. Here's how to fix it:

## 🔍 Quick Diagnosis

### 1. Run the Debug Script
```bash
node scripts/debug-whatsapp-webhook.js
```

This script will check:
- ✅ Your webhook settings
- ✅ Webhook URL accessibility
- ✅ Verification token configuration
- ✅ Server response

### 2. Check Your Settings
Go to **Settings > WhatsApp** and verify:
- ✅ Access Token is set
- ✅ Phone Number ID is set
- ✅ Webhook Verify Token is generated
- ✅ API Version is correct

## 🛠️ Step-by-Step Fix

### Step 1: Verify Webhook URL
Your webhook URL should be:
```
https://your-domain.com/api/whatsapp-business-webhook
```

**Important:**
- Must be **HTTPS** (not HTTP)
- Must be **publicly accessible**
- Must not have trailing slashes
- Must be the exact URL from your settings

### Step 2: Check Verify Token
1. Go to **Settings > WhatsApp**
2. Click **"Generate"** next to Webhook Verify Token
3. Copy the new token
4. Update it in **Meta Developer Console**

### Step 3: Meta Developer Console Setup
In your Meta Developer Console:

1. **Go to your WhatsApp App**
2. **Click "Configuration" → "Webhooks"**
3. **Add Webhook:**
   - **Webhook URL**: `https://your-domain.com/api/whatsapp-business-webhook`
   - **Verify Token**: Use the token from your settings
4. **Subscribe to fields:**
   - ✅ `messages`
   - ✅ `message_status`
   - ✅ `message_template_status_update`

### Step 4: Test the Webhook
Use the test endpoint to verify:
```
https://your-domain.com/api/whatsapp-webhook-test
```

## 🔧 Common Issues & Solutions

### Issue 1: "URL not accessible"
**Solution:**
- Make sure your server is running
- Check if the URL is publicly accessible
- Verify HTTPS is enabled
- Test with: `curl https://your-domain.com/api/whatsapp-business-webhook`

### Issue 2: "Invalid verify token"
**Solution:**
- Generate a new token in Settings > WhatsApp
- Copy the exact token (case-sensitive)
- Update in Meta Developer Console
- Make sure no extra spaces

### Issue 3: "Server error"
**Solution:**
- Check your server logs
- Verify the API route is deployed
- Make sure the webhook endpoint is working

### Issue 4: "Timeout error"
**Solution:**
- Your server must respond within 20 seconds
- Optimize your webhook endpoint
- Check server performance

## 🧪 Testing Your Webhook

### Test 1: Manual Verification
```bash
curl "https://your-domain.com/api/whatsapp-business-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Expected response: `test123`

### Test 2: Check Server Logs
Look for these log messages:
```
🔍 WhatsApp Business webhook request received
🔍 Webhook verification request
✅ WhatsApp Business webhook verified successfully
```

### Test 3: Use Test Endpoint
1. Temporarily use: `https://your-domain.com/api/whatsapp-webhook-test`
2. Test in Meta Developer Console
3. If it works, switch back to the main endpoint

## 📋 Checklist

Before trying verification again:

- [ ] Webhook URL is correct and accessible
- [ ] Verify token is generated and copied exactly
- [ ] Server is running and responding
- [ ] HTTPS is enabled
- [ ] Meta Developer Console fields are subscribed
- [ ] Your app is in development mode or approved
- [ ] Phone number is verified

## 🚨 Emergency Fix

If nothing works:

1. **Generate new token:**
   ```bash
   node scripts/setup-whatsapp-business-api.js
   ```

2. **Use test endpoint temporarily:**
   - Change webhook URL to: `/api/whatsapp-webhook-test`
   - Test verification
   - Once working, switch back to main endpoint

3. **Check server deployment:**
   - Make sure your API routes are deployed
   - Verify environment variables are set
   - Check server logs for errors

## 📞 Getting Help

If you're still having issues:

1. **Check server logs** for detailed error messages
2. **Run the debug script** and share the output
3. **Verify your Meta Developer Console** setup
4. **Test with the test endpoint** first

## 🔄 Alternative Setup

If webhook verification continues to fail:

1. **Use the setup script:**
   ```bash
   node scripts/setup-whatsapp-business-api.js
   ```

2. **Manual configuration:**
   - Go to Settings > WhatsApp
   - Enter all credentials manually
   - Generate new webhook token
   - Update Meta Developer Console

3. **Test connection:**
   - Use the "Test Connection" button in settings
   - Verify your credentials are working

---

**Remember:** The webhook verification is a one-time setup. Once verified, you won't need to do it again unless you change the URL or token.
