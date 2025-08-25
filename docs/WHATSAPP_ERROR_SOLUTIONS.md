# WhatsApp Error Solutions

## Overview

This document provides solutions for the WhatsApp integration errors you're experiencing, including postMessage origin mismatches, rate limiting (429 errors), and quota limitations.

## ✅ Current Status

Your WhatsApp integration is **working correctly**:
- ✅ Instance is authorized
- ✅ Messages can be sent successfully
- ✅ API credentials are valid

## 🔧 Issues and Solutions

### 1. PostMessage Origin Mismatch

**Error:** `Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://test.chats.green-api.com') does not match the recipient window's origin ('https://console.green-api.com')`

**Cause:** Browser security policy preventing communication between different Green API domains.

**Solutions:**
1. **Clear browser cache and cookies**
2. **Use incognito/private browsing mode**
3. **Disable browser extensions temporarily**
4. **Try a different browser** (Chrome, Firefox, Safari)
5. **Access Green API console directly** at https://console.green-api.com

### 2. Rate Limiting (429 Errors)

**Error:** `GET https://7105.api.green-api.com/waInstance7105284900/getStateInstance/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294 429 (Too Many Requests)`

**Cause:** Too many API requests in a short time period.

**Solutions Implemented:**
1. ✅ **Updated rate limiter** - Increased intervals to 5-8 seconds
2. ✅ **Created status monitor** - Reduced polling to 30-second intervals
3. ✅ **Better error handling** - Comprehensive error management
4. ✅ **Exponential backoff** - Smart retry logic

### 3. Connection Timeout

**Error:** `GET https://cdn5.helpdeskeddy.com//js/contact-widget.js net::ERR_CONNECTION_TIMED_OUT`

**Cause:** External service (helpdeskeddy.com) is unreachable.

**Solution:** This is an external service issue and doesn't affect your WhatsApp integration. You can safely ignore this error.

### 4. Quota Limitations

**Current Status:** Your Green API plan has quota restrictions.

**Allowed Numbers:**
- `254700000000@c.us`
- `254712345678@c.us`
- `255746605561@c.us`

**Solutions:**
1. **Upgrade your plan** at https://console.green-api.com
2. **Use only allowed numbers** for testing
3. **Implement quota management** in your application

## 🚀 Implemented Solutions

### 1. Enhanced Rate Limiter (`src/utils/whatsappRateLimiter.ts`)

```typescript
// Updated intervals to prevent 429 errors
const DEFAULT_CONFIG: RateLimitConfig = {
  minInterval: 5000, // 5 seconds (increased from 2)
  maxRetries: 3,
  baseDelay: 5000, // 5 seconds (increased from 3)
  storageKey: 'whatsapp_api_request'
};
```

### 2. WhatsApp Status Monitor (`src/components/WhatsAppStatusMonitor.tsx`)

- **Reduced polling frequency** to 30 seconds
- **Better error handling** with user-friendly messages
- **Prevents concurrent requests**
- **Visual status indicators**

### 3. Comprehensive Error Handler (`src/utils/whatsappErrorHandler.ts`)

- **User-friendly error messages**
- **Smart retry logic**
- **Error categorization**
- **Debug logging**

### 4. Updated Configuration (`src/config/whatsappConfig.ts`)

```typescript
// Rate Limiting - Updated to prevent 429 errors
rateLimit: {
  messagesPerMinute: 5, // Reduced from 10
  messagesPerHour: 100, // Reduced from 300
  requestsPerMinute: 10, // Reduced from 20
  minIntervalBetweenRequests: 8000, // Increased from 5000ms
  maxConcurrentRequests: 1,
  statusCheckInterval: 30000, // 30 seconds
}
```

## 📱 Usage Instructions

### 1. Using the Status Monitor

```tsx
import { WhatsAppStatusMonitor } from '../components/WhatsAppStatusMonitor';

// In your component
<WhatsAppStatusMonitor 
  autoRefresh={true}
  refreshInterval={30000} // 30 seconds
  onStatusChange={(status) => {
    console.log('Status changed:', status);
  }}
/>
```

### 2. Sending Messages with Rate Limiting

```tsx
import { rateLimitedMessageSend } from '../utils/whatsappRateLimiter';

const sendMessage = async (phoneNumber: string, message: string) => {
  const result = await rateLimitedMessageSend(
    `${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: phoneNumber,
        message: message
      })
    }
  );

  if (result.success) {
    console.log('Message sent:', result.data);
  } else {
    console.error('Error:', result.error);
  }
};
```

### 3. Error Handling

```tsx
import { WhatsAppErrorHandler } from '../utils/whatsappErrorHandler';

try {
  // Your API call
} catch (error) {
  const whatsappError = WhatsAppErrorHandler.handleResponse(response, error);
  console.log('User message:', whatsappError.userFriendlyMessage);
  console.log('Suggested action:', WhatsAppErrorHandler.getSuggestedAction(whatsappError));
}
```

## 🧪 Testing

### 1. Test Message Sending

```bash
node scripts/send-test-message.js
```

### 2. Check Status

```bash
node scripts/fix-whatsapp-origin-issues.js
```

### 3. Monitor in Browser

Use the `WhatsAppStatusMonitor` component in your React application.

## 🔍 Monitoring and Debugging

### 1. Browser Console

Check for these indicators:
- ✅ `📱 Rate limiting: waiting Xms before next request`
- ✅ `📱 API request successful`
- ❌ `📱 Rate limited (429)`

### 2. Network Tab

Monitor API requests:
- **Frequency:** Should be 5-8 seconds apart
- **Status:** Should be 200 OK
- **Rate limiting:** Look for 429 responses

### 3. Rate Limit Status

```typescript
import { getRateLimitStatus } from '../utils/whatsappRateLimiter';

const status = getRateLimitStatus();
console.log('Time since last requests:', status);
```

## 📋 Best Practices

1. **Always use rate limiter** - Don't make direct API calls
2. **Handle errors gracefully** - Check `result.success` before using data
3. **Monitor retry counts** - Log retry attempts for debugging
4. **Respect intervals** - Don't override minimum intervals
5. **Clear on logout** - Clear rate limit timestamps when user logs out

## 🆘 Troubleshooting

### Still Getting 429 Errors?

1. **Check rate limit status:**
   ```bash
   node scripts/fix-whatsapp-origin-issues.js
   ```

2. **Clear rate limits:**
   ```typescript
   import { clearRateLimitTimestamps } from '../utils/whatsappRateLimiter';
   clearRateLimitTimestamps();
   ```

3. **Increase intervals further:**
   ```typescript
   // In whatsappRateLimiter.ts
   minInterval: 10000, // 10 seconds
   ```

### PostMessage Errors Persist?

1. **Clear browser data completely**
2. **Try different browser**
3. **Access Green API console directly**
4. **Check for browser extensions interfering**

### Messages Not Sending?

1. **Check allowed numbers** - Only send to allowed numbers
2. **Verify instance status** - Ensure instance is authorized
3. **Check quota** - Verify you haven't exceeded limits
4. **Test with simple message** - Use basic text first

## 📞 Support

If issues persist:

1. **Check Green API documentation:** https://green-api.com/docs/
2. **Contact Green API support** through their console
3. **Review your plan limits** and consider upgrading
4. **Check network connectivity** and firewall settings

## 🎯 Summary

Your WhatsApp integration is working correctly. The errors you're seeing are primarily:

1. **Browser security policies** (postMessage) - Use incognito mode or different browser
2. **Rate limiting** (429) - Fixed with updated rate limiter
3. **External service issues** (helpdeskeddy) - Can be ignored
4. **Quota limitations** - Use allowed numbers or upgrade plan

The implemented solutions should resolve most issues and provide a stable WhatsApp integration experience.
