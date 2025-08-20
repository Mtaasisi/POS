# Deployment Guide for Webhook Hosting

This guide will help you deploy your LATS CHANCE app to make your webhook active and accessible.

## Option 1: Deploy to Vercel (Recommended)

### Prerequisites
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Make sure you have a Vercel account at [vercel.com](https://vercel.com)

### Deployment Steps

1. **Login to Vercel**:
```bash
vercel login
```

2. **Deploy your app**:
```bash
vercel --prod
```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name (e.g., "lats-chance")
   - Confirm deployment settings

4. **Get your webhook URL**:
After deployment, your webhook will be available at:
```
https://your-project-name.vercel.app/api/chrome-extension-webhook
```

### Environment Variables

Set these in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add your Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Option 2: Deploy to Netlify

### Prerequisites
1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Create a `netlify.toml` file:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deployment Steps

1. **Login to Netlify**:
```bash
netlify login
```

2. **Deploy**:
```bash
netlify deploy --prod
```

## Option 3: Deploy to Railway

### Prerequisites
1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Create a `railway.json` file:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Deployment Steps

1. **Login to Railway**:
```bash
railway login
```

2. **Deploy**:
```bash
railway up
```

## Testing Your Webhook

After deployment, test your webhook:

1. **Test the endpoint**:
```bash
curl -X GET https://your-domain.com/api/chrome-extension-webhook
```

2. **Test with a POST request**:
```bash
curl -X POST https://your-domain.com/api/chrome-extension-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "data": {
      "id": "test_123",
      "chatId": "test_chat",
      "content": "Hello world",
      "type": "text",
      "timestamp": 1234567890,
      "isFromMe": false,
      "customerPhone": "+1234567890",
      "customerName": "Test User"
    }
  }'
```

## Chrome Extension Configuration

Update your Chrome extension with the new webhook URL:

1. **Webhook URL**: `https://your-domain.com/api/chrome-extension-webhook`
2. **API Key**: `1755675069644-f5ab0e92276f1e3332d41ece111c6201`

## Monitoring

### Vercel Dashboard
- View function logs in the Vercel dashboard
- Monitor webhook performance
- Check for errors

### Logs
Your webhook logs will show:
- Incoming requests
- Processing status
- Error messages

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure CORS headers are set in `vercel.json`
   - Check if your Chrome extension is sending proper headers

2. **Function Timeout**:
   - Vercel functions have a 10-second timeout
   - Optimize your webhook processing

3. **Database Connection**:
   - Verify Supabase environment variables are set
   - Check database connection in logs

### Debug Steps

1. **Check deployment logs**:
```bash
vercel logs
```

2. **Test locally**:
```bash
npm run dev
```

3. **Verify environment variables**:
```bash
vercel env ls
```

## Security Considerations

1. **API Key Protection**:
   - Store API keys in environment variables
   - Never expose keys in client-side code

2. **Webhook Validation**:
   - Implement proper validation for incoming webhooks
   - Use HTTPS only in production

3. **Rate Limiting**:
   - Consider implementing rate limiting for webhook endpoints
   - Monitor for abuse

## Cost Considerations

### Vercel
- Free tier: 100GB bandwidth, 100 serverless function executions/day
- Pro tier: $20/month for unlimited functions

### Netlify
- Free tier: 100GB bandwidth, 125K function invocations/month
- Pro tier: $19/month for more resources

### Railway
- Free tier: $5 credit monthly
- Pay-as-you-go pricing

## Next Steps

After deployment:

1. **Update your Chrome extension** with the new webhook URL
2. **Test the integration** thoroughly
3. **Monitor performance** and logs
4. **Set up alerts** for webhook failures
5. **Document the setup** for your team

## Support

If you encounter issues:

1. Check the deployment logs
2. Verify environment variables
3. Test the webhook endpoint
4. Review the Chrome extension configuration
5. Contact support if needed
