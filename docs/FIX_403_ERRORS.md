# Fixing 403 Forbidden Errors with Green API

## Problem
You're getting `403 Forbidden` errors when trying to access Green API endpoints. This means the API is rejecting your requests due to authentication or authorization issues.

## Error Analysis
From your logs, we can see:
- Instance ID: `7105306911`
- Status: `403 Forbidden`
- Endpoints failing: `/qr`, `/getAuthorizationCode`, `/reboot`, `/getStateInstance`

## Root Causes

### 1. Invalid API Token
The most common cause is an incorrect or expired API token.

### 2. Instance Doesn't Exist
The instance ID `7105306911` might not exist in your Green API account.

### 3. Instance Not Authorized
The instance exists but hasn't been properly set up or authorized.

### 4. Wrong Green API Account
You might be using credentials from a different Green API account.

## Step-by-Step Fix

### Step 1: Verify Your Green API Account

1. **Go to Green API Console**
   - Visit: https://console.green-api.com/
   - Log in with your credentials

2. **Check Your Instances**
   - Look for instance with ID: `7105306911`
   - If it doesn't exist, that's the problem

### Step 2: Check Instance Details

If the instance exists, verify:
- ✅ Instance ID matches exactly: `7105306911`
- ✅ API token is correct and not expired
- ✅ Instance status is "authorized"
- ✅ Phone number is correct

### Step 3: Test with Direct API Call

Use curl to test the connection directly:

```bash
curl -X GET "https://api.green-api.com/waInstance7105306911/getStateInstance" \
     -H "Authorization: Bearer YOUR_API_TOKEN"
```

Replace `YOUR_API_TOKEN` with your actual API token.

### Step 4: Fix the Issue

#### Option A: Update API Token
If the instance exists but token is wrong:

1. Copy the correct API token from Green API console
2. Update your database record
3. Test again

#### Option B: Create New Instance
If the instance doesn't exist or is corrupted:

1. **Delete the old instance** (if it exists)
2. **Create a new WhatsApp instance**:
   - Go to Green API console
   - Click "Create Instance"
   - Choose WhatsApp
   - Note the new instance ID and API token

3. **Update your database**:
   ```sql
   UPDATE whatsapp_instances 
   SET 
     instance_id = 'NEW_INSTANCE_ID',
     api_token = 'NEW_API_TOKEN',
     status = 'disconnected'
   WHERE instance_id = '7105306911';
   ```

4. **Authorize the new instance**:
   - Get the QR code
   - Scan with WhatsApp
   - Wait for authorization

#### Option C: Fix Instance Authorization
If instance exists but isn't authorized:

1. Get the QR code for the instance
2. Scan it with the WhatsApp number
3. Wait for the instance to become "authorized"

## Testing the Fix

### 1. Test with our debug script:
```bash
node scripts/test-green-api-direct.js
```

### 2. Test in your app:
- Navigate to WhatsApp settings
- Check if 403 errors are gone
- Verify instance state shows correctly

### 3. Test specific endpoints:
```bash
# Test state
curl -X GET "https://api.green-api.com/waInstance7105306911/getStateInstance" \
     -H "Authorization: Bearer YOUR_API_TOKEN"

# Test QR code
curl -X GET "https://api.green-api.com/waInstance7105306911/qr" \
     -H "Authorization: Bearer YOUR_API_TOKEN"

# Test settings
curl -X GET "https://api.green-api.com/waInstance7105306911/getSettings" \
     -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Common Issues and Solutions

### Issue: "Instance not found"
**Solution**: Create a new instance in Green API console

### Issue: "Invalid token"
**Solution**: Copy the correct API token from Green API console

### Issue: "Instance not authorized"
**Solution**: Scan QR code with WhatsApp to authorize

### Issue: "Wrong account"
**Solution**: Check you're using the right Green API account

## Prevention

1. **Always verify credentials** before using them
2. **Test with curl** first to ensure API works
3. **Keep API tokens secure** and don't share them
4. **Monitor instance status** regularly
5. **Have backup instances** ready

## Getting Help

If you're still having issues:

1. **Check Green API documentation**: https://green-api.com/docs/
2. **Contact Green API support**: https://green-api.com/support/
3. **Verify your account status**: Make sure your account is active
4. **Check rate limits**: Ensure you're not hitting API limits

## Quick Commands

```bash
# Test current instance
node scripts/test-green-api-direct.js

# Start development proxy
npm run dev:proxy

# Debug connection issues
node scripts/debug-green-api.js

# Test with curl (replace YOUR_API_TOKEN)
curl -X GET "https://api.green-api.com/waInstance7105306911/getStateInstance" \
     -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Expected Results

After fixing the 403 errors:
- ✅ No more "403 Forbidden" errors
- ✅ Instance state shows correctly
- ✅ QR code can be generated
- ✅ Settings can be retrieved
- ✅ Reboot and other operations work
