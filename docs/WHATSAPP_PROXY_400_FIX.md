# WhatsApp Proxy 400 Error Fix Guide

## Problem Analysis
You're experiencing 400 Bad Request errors with the WhatsApp proxy, but the proxy itself is working correctly. The issue is that **the frontend is sending invalid requests**.

## Root Cause
The frontend is sending requests that don't include a valid `action` field. The WhatsApp proxy requires:
- A valid `action` field in the request body
- One of the supported actions: `health`, `getStateInstance`, `getSettings`, `sendMessage`, etc.

## Solutions

### Solution 1: Fix Frontend Code (Recommended)

Update your frontend code to send valid requests:

```javascript
// ❌ Invalid - missing action
fetch('/api/whatsapp-proxy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
});

// ❌ Invalid - empty action
fetch('/api/whatsapp-proxy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: '' })
});

// ✅ Valid - with proper action
fetch('/api/whatsapp-proxy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        action: 'getStateInstance' 
    })
});

// ✅ Valid - with action and data
fetch('/api/whatsapp-proxy.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        action: 'sendMessage',
        data: {
            chatId: '1234567890@c.us',
            message: 'Hello World'
        }
    })
});
```

### Solution 2: Use the Alternative Endpoint

Use the simplified WhatsApp API endpoint that's more forgiving:

```javascript
// Use the alternative endpoint
const response = await fetch('/api/whatsapp-api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        action: 'getStateInstance' 
    })
});
```

### Solution 3: Add Request Validation

Add validation to your frontend code:

```javascript
async function callWhatsAppAPI(action, data = null) {
    // Validate action
    const validActions = [
        'health', 'getStateInstance', 'getSettings', 'sendMessage',
        'getChats', 'getChatHistory', 'getQRCode'
    ];
    
    if (!action || !validActions.includes(action)) {
        throw new Error(`Invalid action: ${action}. Valid actions: ${validActions.join(', ')}`);
    }
    
    const response = await fetch('/api/whatsapp-proxy.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API error: ${error.error || response.statusText}`);
    }
    
    return response.json();
}

// Usage
try {
    const result = await callWhatsAppAPI('getStateInstance');
    console.log('WhatsApp status:', result);
} catch (error) {
    console.error('WhatsApp error:', error.message);
}
```

### Solution 4: Debug Frontend Requests

Add debugging to see what requests are being sent:

```javascript
// Add this to your frontend code to debug requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    if (args[0].includes('whatsapp-proxy.php')) {
        console.log('WhatsApp request:', {
            url: args[0],
            method: args[1]?.method,
            body: args[1]?.body
        });
    }
    return originalFetch.apply(this, args);
};
```

## Valid Actions

The WhatsApp proxy supports these actions:

| Action | Description | Data Required |
|--------|-------------|---------------|
| `health` | Check if the proxy is working | No |
| `getStateInstance` | Get WhatsApp instance status | No |
| `getSettings` | Get WhatsApp settings | No |
| `sendMessage` | Send a message | Yes - `{chatId, message}` |
| `getChats` | Get list of chats | No |
| `getChatHistory` | Get chat history | Yes - `{chatId, count}` |
| `getQRCode` | Get QR code for login | No |

## Testing Commands

Test the proxy directly:

```bash
# Test health check
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"action": "health"}'

# Test get state
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"action": "getStateInstance"}'

# Test invalid request (should return 400)
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Files to Check

1. **Frontend JavaScript files** - Look for fetch calls to `/api/whatsapp-proxy.php`
2. **React/Vue components** - Check WhatsApp-related components
3. **API service files** - Look for WhatsApp API service functions

## Common Frontend Issues

1. **Missing action field**:
   ```javascript
   // ❌ Wrong
   body: JSON.stringify({ data: {...} })
   
   // ✅ Correct
   body: JSON.stringify({ action: 'sendMessage', data: {...} })
   ```

2. **Empty action**:
   ```javascript
   // ❌ Wrong
   body: JSON.stringify({ action: '' })
   
   // ✅ Correct
   body: JSON.stringify({ action: 'getStateInstance' })
   ```

3. **Invalid action**:
   ```javascript
   // ❌ Wrong
   body: JSON.stringify({ action: 'test' })
   
   // ✅ Correct
   body: JSON.stringify({ action: 'health' })
   ```

## Expected Results

After fixing the frontend code:
- ✅ No more 400 errors in browser console
- ✅ WhatsApp API calls work correctly
- ✅ Proper error handling for invalid requests
- ✅ All WhatsApp functionality works

## Next Steps

1. **Check browser console** for the exact request being made
2. **Update frontend code** to include valid actions
3. **Test with the alternative endpoint** if needed
4. **Add proper error handling** for API calls
5. **Monitor for any remaining issues**

## Troubleshooting

If you still get 400 errors after fixing the frontend:

1. **Check browser Network tab** for the exact request
2. **Verify the action field** is present and valid
3. **Test with curl** to confirm the proxy works
4. **Use the alternative endpoint** as a fallback
5. **Add debugging** to see what's being sent
