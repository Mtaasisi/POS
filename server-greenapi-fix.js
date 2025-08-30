// Fixed Green API proxy endpoint for instance 7105284900
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fixed Green API proxy endpoint
app.all('/api/green-api-proxy', async (req, res) => {
  try {
    console.log('🔍 Green API proxy request:', req.method, req.path);
    
    // Get parameters from query string or body
    const { instanceId, endpoint, token, ...otherParams } = req.method === 'GET' ? req.query : req.body;
    
    if (!instanceId || !endpoint || !token) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['instanceId', 'endpoint', 'token'],
        received: { instanceId, endpoint, token }
      });
    }
    
    console.log(`📱 Instance ID: ${instanceId}, Endpoint: ${endpoint}`);
    
    // Use the correct Green API URL based on instance ID
    let apiUrl = 'https://api.green-api.com';
    
    // Use specific URL for instance 7105284900
    if (instanceId === '7105284900') {
      apiUrl = 'https://7105.api.greenapi.com';
    }
    
    console.log(`🔑 Using API URL: ${apiUrl}`);
    
    // Build target URL with token as path parameter (GreenAPI format)
    const targetUrl = `${apiUrl}/waInstance${instanceId}/${endpoint}/${token}`;
    console.log(`🎯 Target URL: ${targetUrl}`);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Green-API-Proxy/1.0',
      'Accept': 'application/json'
    };
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
      timeout: 30000
    };
    
    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(otherParams).length > 0) {
      requestOptions.body = JSON.stringify(otherParams);
    }
    
    console.log(`📤 Forwarding request to Green API...`);
    
    // Make request to Green API
    const response = await fetch(targetUrl, requestOptions);
    const responseText = await response.text();
    
    console.log(`📥 Green API response: ${response.status} ${response.statusText}`);
    console.log(`📥 Response text: ${responseText}`);
    
    // Set response headers for CORS
    res.set('Content-Type', 'application/json');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Forward the response
    res.status(response.status).send(responseText);
    
  } catch (error) {
    console.error('❌ Green API proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fixed GreenAPI Proxy Server running on port ${PORT}`);
  console.log(`📱 Configured for instance: 7105284900`);
  console.log(`🔗 API URL: https://7105.api.greenapi.com`);
});
