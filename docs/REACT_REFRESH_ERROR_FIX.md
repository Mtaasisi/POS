# React Refresh Error Fix Guide

## Overview

This guide helps you resolve React refresh errors that occur during development, particularly with the `@react-refresh` module.

## Common Symptoms

- Error messages mentioning `@react-refresh`
- Errors in `ProtectedRoute` component during hot reloading
- Authentication context errors during development
- Component stack errors during React refresh
- **500 Internal Server Error when loading large files like `customerApi.ts`**

## Quick Fixes

### 1. Clear Cache (Recommended First Step)

Run the cache clearing script:

```bash
npm run clear-cache
```

This will:
- Clear problematic localStorage data
- Clear Vite cache directories
- Create a helper HTML file to clear browser localStorage

### 2. Manual Browser Cache Clear

1. Open the generated `scripts/clear-localstorage.html` file in your browser
2. Close the tab after it shows "LocalStorage cleared successfully"
3. Clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### 3. Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart
npm run dev
```

## Error Handling Improvements

The following improvements have been made to handle React refresh errors:

### ProtectedRoute Component
- Added error boundaries with try-catch blocks
- Added fallback UI for authentication errors
- Improved error recovery mechanisms

### ErrorBoundary Component
- Enhanced to detect React refresh errors specifically
- Added development-specific error messages
- Improved error recovery with cache clearing

### VariantProductCard Component
- Added defensive programming with null checks
- Added error handling for general settings
- Added error recovery mechanisms

## Customer API Restructuring

### Problem
The original `customerApi.ts` file was 2147 lines long, causing 500 Internal Server Errors when Vite tried to serve it during development. Additionally, multiple components were calling `fetchAllCustomers` simultaneously, causing duplicate requests and inefficient data fetching.

### Solution
The large file has been split into smaller, more manageable modules with request deduplication:

#### New Structure
```
src/lib/customerApi/
├── core.ts          # Core customer functions (fetch, add, update)
├── search.ts        # Search-related functions
└── customerApi.ts   # Main entry point (now much smaller)
```

#### Request Deduplication
Added intelligent request deduplication to prevent multiple simultaneous calls:

- **Request Cache**: Prevents duplicate requests for the same data
- **Promise Sharing**: Multiple components calling the same function share the same promise
- **Automatic Cleanup**: Cache is cleaned up after requests complete
- **React Hook**: New `useCustomers` hook for better state management

#### Benefits
- **Reduced file size**: Main file now ~200 lines instead of 2147
- **Better organization**: Functions grouped by purpose
- **Improved maintainability**: Easier to find and modify specific functions
- **Better performance**: Vite can serve smaller files more efficiently
- **Backward compatibility**: All existing imports continue to work
- **Request deduplication**: Prevents duplicate API calls
- **Better caching**: Intelligent caching with automatic cleanup

#### Files Affected
- `src/lib/customerApi.ts` - Now serves as main entry point
- `src/lib/customerApi/core.ts` - Core customer functions with deduplication
- `src/lib/customerApi/search.ts` - Search and background search functions
- `src/lib/customerApi.ts.backup` - Backup of original large file
- `src/hooks/useCustomers.ts` - New React hook for customer management
- `src/context/CustomersContext.tsx` - Updated to use new hook

#### Migration
No code changes required! All existing imports continue to work:

```typescript
// These imports still work exactly the same
import { fetchAllCustomers, formatCurrency } from '../lib/customerApi';
import { searchCustomersFast } from '../lib/customerApi';
```

#### New Features
```typescript
// Use the new hook for better request management
import { useCustomers } from '../hooks/useCustomers';

function MyComponent() {
  const { customers, loading, error, refetch, clearCache } = useCustomers({
    simple: false,
    autoFetch: true,
    cacheKey: 'my-component'
  });
  
  // The hook automatically handles deduplication and caching
}
```

## Prevention Tips

### 1. Avoid Large State Changes During Development
- Don't make large changes to context providers during development
- Save files incrementally rather than all at once

### 2. Use Error Boundaries
- Components now have built-in error boundaries
- Errors are caught and handled gracefully

### 3. Monitor Console
- Watch for React refresh warnings in the console
- Address any context or state issues immediately

### 4. Keep Files Manageable
- Split large files into smaller modules
- Use the customer API structure as a template for other large files

## Advanced Troubleshooting

### If Errors Persist

1. **Clear All Caches:**
   ```bash
   npm run clear-cache
   rm -rf node_modules/.vite
   rm -rf .vite
   ```

2. **Reinstall Dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check for Circular Dependencies:**
   - Look for imports that might create circular dependencies
   - Check context providers for proper initialization

4. **Check for Large Files:**
   - Look for files over 1000 lines that might cause 500 errors
   - Consider splitting them into smaller modules

### Debug Mode

Enable debug logging by adding to your browser console:

```javascript
localStorage.setItem('debug', 'true');
```

## Error Recovery

The application now includes automatic error recovery:

1. **React Refresh Errors:** Automatically detected and handled
2. **Authentication Errors:** Fallback UI with retry options
3. **Context Errors:** Graceful degradation with default values
4. **500 File Errors:** Large files split into manageable modules

## Support

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Look for patterns in when the errors occur
3. Consider if the error is related to specific components or contexts
4. Use the error boundary's "Show technical details" to get more information
5. Check if any files are too large and need to be split

## Related Files

- `src/App.tsx` - ProtectedRoute improvements
- `src/features/shared/components/ErrorBoundary.tsx` - Enhanced error handling
- `src/features/lats/components/pos/VariantProductCard.tsx` - Defensive programming
- `scripts/clear-react-refresh-cache.js` - Cache clearing utility
- `src/lib/customerApi.ts` - Restructured customer API (main entry point)
- `src/lib/customerApi/core.ts` - Core customer functions
- `src/lib/customerApi/search.ts` - Search functions
- `src/lib/customerApi.ts.backup` - Backup of original large file
