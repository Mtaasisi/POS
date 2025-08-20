# WhatsApp Rate Limiting Fix

## Problem
The application was experiencing frequent 429 (Too Many Requests) errors from the Green API due to:
- Too frequent connection health checks
- Insufficient caching
- No rate limit backoff mechanism
- Multiple components making simultaneous API calls
- Excessive chat creation operations

## Solutions Implemented

### 1. Enhanced Rate Limiter
- **Increased minimum interval**: From 30 seconds to 60 seconds between API calls
- **Extended caching**: Connection health results cached for 60 minutes instead of 30 minutes
- **Rate limit backoff**: Exponential backoff up to 30 minutes when 429 errors occur
- **Better error handling**: Specific handling for rate limit errors with longer cooldowns

### 2. Reduced Check Frequencies
- **Health monitor**: Reduced from every 60 minutes to every 120 minutes (2 hours)
- **Connection checks**: Increased cooldown from 10 minutes to 15 minutes
- **Healthy connection interval**: Extended from 30 minutes to 60 minutes
- **Rate limit cooldown**: Extended to 30 minutes for rate limit errors

### 3. Optimized Chat Sync Process
- **Batch operations**: Process chats in batches of 50 instead of individual operations
- **Rate limiting**: Added 1-second delays between batches
- **Error handling**: Continue processing other batches if one fails
- **Reduced database load**: More efficient database operations

### 4. Rate Limit Monitoring
- **WhatsAppRateLimitMonitor component**: Real-time monitoring of rate limit status
- **localStorage tracking**: Stores rate limit state for persistence across sessions
- **Clear rate limit state**: Manual button to reset rate limiting when needed
- **Time tracking**: Shows countdown until rate limit reset

### 5. Utility Script
- **clear-whatsapp-rate-limit.js**: Node.js script to clear rate limit states
- **Cache clearing**: Removes cached data that might be causing issues
- **Browser console commands**: Instructions for manual clearing

## Usage

### Monitor Rate Limits
The rate limit monitor is now included in the WhatsApp page:

```tsx
import WhatsAppRateLimitMonitor from '../components/WhatsAppRateLimitMonitor';

// Automatically included in WhatsAppWebPage.tsx
<WhatsAppRateLimitMonitor />
```

### Clear Rate Limit State
If you're experiencing persistent rate limiting:

1. **Browser console**:
```javascript
// Clear rate limit state
localStorage.removeItem('whatsapp_rate_limit_backoff');
localStorage.removeItem('whatsapp_last_error');
localStorage.removeItem('whatsapp_error_count');
localStorage.removeItem('whatsapp_connection_health');
localStorage.removeItem('whatsapp_last_check');
sessionStorage.removeItem('whatsapp_connection_health');
```

2. **Using the utility script**:
```bash
node scripts/clear-whatsapp-rate-limit.js
```

3. **Using the monitor component**: Click "Clear Rate Limit State" button

### Best Practices

1. **Wait after rate limits**: Don't make new API calls for 30 minutes after a 429 error
2. **Monitor your Green API dashboard**: Check your current rate limit status
3. **Consider upgrading**: If rate limits persist, consider upgrading your Green API plan
4. **Use webhooks**: Implement webhooks instead of polling when possible
5. **Implement caching**: Cache API responses aggressively to reduce calls
6. **Batch operations**: Use batch operations for database changes

## Configuration

### Rate Limiter Settings
```typescript
// In whatsappService.ts
private minInterval: number = 60000; // 60 seconds between calls
private maxConsecutiveErrors: number = 3; // Max consecutive errors before backoff
```

### Cache Settings
```typescript
// Connection health cache duration
}, cacheKey, 3600000); // 60 minutes cache
```

### Check Intervals
```typescript
// Health monitor interval
const interval = setInterval(checkHealth, 120 * 60 * 1000); // 120 minutes

// Connection check cooldown
const CONNECTION_CHECK_COOLDOWN = 900000; // 15 minutes
const HEALTHY_CHECK_INTERVAL = 3600000; // 60 minutes
const RATE_LIMIT_COOLDOWN = 1800000; // 30 minutes
```

### Batch Processing
```typescript
// Chat sync batch size
const BATCH_SIZE = 50; // Process 50 chats at a time
const BATCH_DELAY = 1000; // 1 second delay between batches
```

## Troubleshooting

### Still Getting Rate Limits?
1. Check your Green API dashboard for current usage
2. Wait 30 minutes before making new requests
3. Clear rate limit state using the monitor component
4. Consider implementing webhooks instead of polling
5. Contact Green API support if issues persist

### Performance Impact
- Reduced API calls should improve overall performance
- Longer caching reduces server load
- Better error handling prevents cascading failures
- Batch operations reduce database load

### Monitoring
- Use the WhatsAppRateLimitMonitor to track rate limit status
- Monitor console logs for rate limit warnings
- Check localStorage for rate limit state
- Use browser dev tools to monitor network requests

## Files Modified
- `src/services/whatsappService.ts` - Enhanced rate limiter and caching
- `src/components/WhatsAppHealthMonitor.tsx` - Reduced check frequency
- `src/features/whatsapp/pages/WhatsAppWebPage.tsx` - Extended cooldown periods and optimized chat sync
- `src/components/WhatsAppRateLimitMonitor.tsx` - Enhanced monitoring component
- `scripts/clear-whatsapp-rate-limit.js` - Updated utility script

## Future Improvements
- Implement webhook-based message receiving
- Add automatic rate limit detection and adjustment
- Implement connection pooling for API calls
- Add rate limit analytics and reporting
- Consider using a queue system for API calls
