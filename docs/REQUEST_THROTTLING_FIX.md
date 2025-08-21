# Request Throttling Fix for ERR_INSUFFICIENT_RESOURCES

## Problem Description

The application was experiencing `ERR_INSUFFICIENT_RESOURCES` errors when making multiple concurrent requests to Supabase. This error typically occurs when:

1. **Too many concurrent requests** are made simultaneously
2. **Small batch sizes** result in many individual requests
3. **No request throttling** leads to overwhelming the connection pool
4. **Browser resource limits** are exceeded

## Error Examples

```
GET https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/devices?select=*&customer_id=eq.2c9d15d8-cd70-4c5f-b2e0-354978b566cd net::ERR_INSUFFICIENT_RESOURCES
GET https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/lats_product_variants?select=id%2Cproduct_id%2Cname%2Csku%2Ccost_price%2Cselling_price%2Cquantity&product_id=in.%28...%29&order=selling_price.asc net::ERR_INSUFFICIENT_RESOURCES
```

## Root Causes Identified

### 1. Product Variant Batching Issues
- **Location**: `src/features/lats/lib/data/provider.supabase.ts`
- **Problem**: Batch size was too small (5), causing many requests
- **Impact**: 50 products = 10 batches = 10 concurrent requests

### 2. Device Queries Without Throttling
- **Location**: `src/lib/deviceServices.ts`
- **Problem**: Multiple device queries for different customers running simultaneously
- **Impact**: Each customer page load triggers multiple device queries

### 3. Customer Data Fetching
- **Location**: `src/lib/customerApi.ts`
- **Problem**: Individual requests for each customer's related data
- **Impact**: N+1 query problem with many concurrent requests

## Solution Implemented

### 1. Request Throttling Utility

Created a singleton `RequestThrottler` class that:
- Limits concurrent requests to 2 at a time
- Adds 500ms delay between requests
- Queues requests and processes them sequentially
- Provides exponential backoff for retries

```typescript
class RequestThrottler {
  private static instance: RequestThrottler;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 2;
  private delayBetweenRequests = 500;

  async execute<T>(request: () => Promise<T>): Promise<T> {
    // Implementation with queuing and throttling
  }
}
```

### 2. Product Variant Optimization

**Before:**
- Batch size: 5 products
- No throttling
- Immediate retries on failure

**After:**
- Batch size: 10 products (reduced request count by 50%)
- Request throttling with 500ms delays
- Exponential backoff: 2s, 4s, 8s delays
- Fallback to individual queries if batch fails

### 3. Device Services Throttling

Added throttling to `getDevicesByCustomer()` function:
- Wraps device queries in throttler
- Prevents multiple concurrent device queries
- Maintains functionality while reducing resource usage

### 4. Customer API Optimization

- Implemented pagination for large customer datasets
- Added throttling for related data fetching
- Reduced batch sizes to prevent overwhelming the system

## Performance Improvements

### Test Results
- **Before**: Multiple failed requests with ERR_INSUFFICIENT_RESOURCES
- **After**: 100% success rate with throttled requests
- **Average request time**: ~630ms (acceptable for background operations)
- **Concurrent requests**: Limited to 2 at a time

### Metrics
```
Total duration: 6296ms
Average per request: 629.60ms
Successful requests: 10
Failed requests: 0
```

## Implementation Details

### Files Modified

1. **`src/features/lats/lib/data/provider.supabase.ts`**
   - Added RequestThrottler class
   - Increased batch size from 5 to 10
   - Implemented throttled variant fetching
   - Added exponential backoff for retries

2. **`src/lib/deviceServices.ts`**
   - Added RequestThrottler class
   - Wrapped getDevicesByCustomer in throttler
   - Moved utility functions to utils.ts

3. **`src/lib/utils.ts`**
   - Added toCamelCase and toSnakeCase functions
   - Centralized utility functions

4. **`scripts/test-throttling.js`**
   - Created test script to verify throttling works
   - Tests 10 concurrent requests
   - Validates success rate and performance

### Configuration

```typescript
// Throttling settings
const maxConcurrent = 2;        // Max concurrent requests
const delayBetweenRequests = 500; // 500ms between requests
const batchSize = 10;           // Products per batch
const maxRetries = 3;           // Retry attempts
const backoffMultiplier = 2000; // 2s, 4s, 8s delays
```

## Best Practices Implemented

### 1. Request Management
- **Queue-based processing**: Requests are queued and processed sequentially
- **Concurrency control**: Maximum 2 concurrent requests
- **Rate limiting**: 500ms delay between requests

### 2. Error Handling
- **Exponential backoff**: Increasing delays between retries
- **Graceful degradation**: Fallback to individual queries
- **Error logging**: Comprehensive error tracking

### 3. Performance Optimization
- **Larger batch sizes**: Reduced total request count
- **Pagination**: Process large datasets in chunks
- **Caching**: Maintain offline data when possible

## Monitoring and Debugging

### Console Logging
The implementation includes detailed logging:
```
📦 Processing 50 products (limited from 100 total)
⏳ Waiting 2000ms before retry...
✅ Variant batch query succeeded on attempt 2
📸 Fetched images for 45 products
💰 Fetched variants for 120 products
```

### Error Tracking
- Failed request attempts are logged with error codes
- Retry attempts are tracked with delays
- Fallback strategies are documented

## Future Improvements

### 1. Adaptive Throttling
- Adjust throttling based on server response times
- Implement circuit breaker pattern for repeated failures
- Dynamic batch size adjustment

### 2. Request Prioritization
- Prioritize user-facing requests over background operations
- Implement request cancellation for stale requests
- Add request timeout handling

### 3. Caching Strategy
- Implement Redis or similar for server-side caching
- Add request deduplication for identical queries
- Implement optimistic updates with rollback

## Testing

Run the throttling test:
```bash
node scripts/test-throttling.js
```

Expected output:
```
🎉 All requests succeeded! Throttling is working correctly.
```

## Conclusion

The request throttling implementation successfully resolves the `ERR_INSUFFICIENT_RESOURCES` errors by:

1. **Limiting concurrent requests** to prevent resource exhaustion
2. **Adding delays between requests** to respect rate limits
3. **Implementing exponential backoff** for failed requests
4. **Optimizing batch sizes** to reduce total request count
5. **Providing fallback strategies** for graceful degradation

This solution maintains application functionality while significantly improving reliability and preventing resource exhaustion errors.
