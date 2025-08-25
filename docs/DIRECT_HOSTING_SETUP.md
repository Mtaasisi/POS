# Direct Hosting Setup Guide

This guide explains how to deploy the LATS CHANCE application with Green API proxy on your direct hosting at `https://inauzwa.store/`.

## Overview

The application has been configured to work with direct hosting instead of Netlify. The Green API proxy is now implemented in PHP to avoid CORS issues.

## Files Structure

```
public/
├── api/
│   ├── green-api-proxy.php      # Main Green API proxy
│   └── test-green-proxy.php     # Test script
├── .htaccess                    # URL rewriting rules
└── index.html                   # Main application
```

## Deployment Steps

### 1. Upload Files

Upload the following files to your hosting:

- `public/api/green-api-proxy.php` → `https://inauzwa.store/api/green-api-proxy.php`
- `public/.htaccess` → `https://inauzwa.store/.htaccess`
- `public/api/test-green-proxy.php` → `https://inauzwa.store/api/test-green-proxy.php`

### 2. Verify Server Requirements

Ensure your hosting supports:
- PHP 7.4 or higher
- cURL extension enabled
- mod_rewrite enabled
- JSON extension enabled

### 3. Test the Proxy

Visit `https://inauzwa.store/api/test-green-proxy.php` to test if the proxy is working.

### 4. Update Environment Variables

Make sure your application has the correct production URL:

```javascript
// The proxy URL is automatically set to:
// https://inauzwa.store/api/green-api-proxy
```

## How It Works

### 1. Frontend Request Flow

1. Your React app makes a request to `https://inauzwa.store/api/green-api-proxy`
2. The `.htaccess` file routes this to `green-api-proxy.php`
3. The PHP script forwards the request to Green API
4. The response is returned to your React app

### 2. CORS Handling

The PHP proxy handles CORS by:
- Setting appropriate headers
- Handling preflight OPTIONS requests
- Allowing cross-origin requests from your domain

### 3. Error Handling

The proxy includes comprehensive error handling:
- Network errors
- Invalid requests
- Green API errors
- Detailed logging for debugging

## Troubleshooting

### Common Issues

1. **404 Error on API calls**
   - Check if `.htaccess` is uploaded correctly
   - Verify mod_rewrite is enabled on your hosting

2. **CORS Errors**
   - Check if the PHP script is setting headers correctly
   - Verify the proxy URL in your frontend code

3. **Green API Errors**
   - Check the server error logs
   - Verify your API tokens are correct
   - Test with the test script first

### Debug Steps

1. Test the proxy directly: `https://inauzwa.store/api/test-green-proxy.php`
2. Check server error logs for PHP errors
3. Verify cURL is enabled on your hosting
4. Test with a simple Green API endpoint first

## Security Considerations

- The proxy only accepts POST requests
- All requests are logged for debugging
- CORS is properly configured
- Input validation is implemented

## Performance

- Requests are proxied with a 30-second timeout
- SSL verification is enabled
- Follows redirects automatically
- Includes proper error handling

## Support

If you encounter issues:

1. Check the server error logs
2. Test the proxy endpoint directly
3. Verify your hosting configuration
4. Contact your hosting provider if needed
