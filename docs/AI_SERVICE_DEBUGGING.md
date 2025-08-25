# AI Service Debugging Guide

## Overview

The AI service (Gemini) has been enhanced with better rate limiting, error handling, and debugging capabilities to prevent 429 "Too Many Requests" errors.

## Key Improvements

### 1. Enhanced Rate Limiting
- **Reduced rate limit**: 1 request per minute (down from 2)
- **Increased intervals**: 60 seconds between requests (up from 30)
- **Queue-based processing**: Requests are queued and processed sequentially
- **Exponential backoff**: Service automatically backs off after consecutive errors

### 2. Better Error Handling
- **Graceful fallbacks**: When AI service fails, fallback suggestions are provided
- **User-friendly messages**: Clear error messages instead of technical jargon
- **Automatic recovery**: Service automatically recovers after backoff periods

### 3. Status Monitoring
- **Real-time status**: AI service status is displayed to users
- **Visual indicators**: Color-coded status badges (green/yellow/red)
- **Countdown timers**: Shows time until service is available again

## Debugging Tools

### Console Access
In the browser console, you can access:

```javascript
// Check AI service status
aiServiceStatus.getStatus()

// Get detailed status with timing info
aiServiceDebug.getDetailedStatus()

// Test if service is ready
aiServiceStatus.isServiceAvailable()

// Start monitoring for 60 seconds
aiServiceDebug.startMonitoring(60000)
```

### Status Indicators
- **🟢 Green**: Service is available
- **🟡 Yellow**: Rate limit reached, wait before next request
- **🔴 Red**: Service unavailable, in backoff period

## Common Issues and Solutions

### 1. 429 Too Many Requests Error
**Cause**: Exceeded Gemini API rate limits
**Solution**: 
- Wait for the automatic backoff period (5-15 minutes)
- Use fallback suggestions in the meantime
- Check the status indicator for availability

### 2. AI Suggestions Not Working
**Cause**: Service in backoff or rate limited
**Solution**:
- Check the AI status badge in the UI
- Use fallback suggestions provided automatically
- Wait for service to become available again

### 3. Slow Response Times
**Cause**: Request queuing and rate limiting
**Solution**:
- This is normal behavior to prevent rate limits
- Requests are processed sequentially with 60-second intervals
- Consider batching multiple requests

## Configuration

### Rate Limiting Settings
```typescript
// In geminiService.ts
private readonly maxRequestsPerMinute: number = 1; // Requests per minute
private readonly minRequestInterval: number = 60000; // Milliseconds between requests
private readonly errorCooldown: number = 300000; // 5 minutes backoff
```

### Environment Variables
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## Best Practices

1. **Check Status First**: Always check `aiServiceStatus.isServiceAvailable()` before making requests
2. **Use Fallbacks**: Implement fallback responses when AI service is unavailable
3. **Monitor Usage**: Use the debug tools to monitor service usage
4. **Batch Requests**: Group multiple AI requests together when possible
5. **User Feedback**: Show clear status indicators to users

## Troubleshooting

### Enable Debug Mode
```javascript
// In browser console
aiServiceDebug.enableDebugMode()
```

### Monitor Service
```javascript
// Monitor for 2 minutes
aiServiceDebug.startMonitoring(120000)
```

### Check Detailed Status
```javascript
// Get comprehensive status info
aiServiceDebug.getDetailedStatus()
```

## Fallback Behavior

When the AI service is unavailable, the system automatically provides:

1. **Spam Analysis**: Basic heuristic-based spam scoring
2. **Suggestions**: Pre-defined best practice suggestions
3. **Risk Assessment**: Conservative risk level estimation
4. **User Notification**: Clear messages about service status

This ensures the application remains functional even when the AI service is experiencing issues.
