#!/usr/bin/env node

/**
 * Development Proxy Server for Green API
 * This server runs locally to avoid CORS issues during development
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 8888;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Green API proxy endpoint
app.post('/green-api-proxy', async (req, res) => {
  try {
    const { path, method, body, headers } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Construct the full URL
    const baseUrl = 'https://api.green-api.com';
    const url = `${baseUrl}${path}`;

    // Prepare request options
    const requestOptions = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`🌐 Proxying request to: ${url}`);
    console.log(`📋 Method: ${requestOptions.method}`);

    // Make the request to Green API
    const response = await fetch(url, requestOptions);
    
    // Get response data
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText };
    }

    console.log(`✅ Response status: ${response.status}`);

    res.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Netlify function proxy endpoint
app.post('/.netlify/functions/green-api-proxy', async (req, res) => {
  try {
    const { path, method, body, headers } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Construct the full URL
    const baseUrl = 'https://api.green-api.com';
    const url = `${baseUrl}${path}`;

    // Prepare request options
    const requestOptions = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`🌐 Proxying Netlify function request to: ${url}`);
    console.log(`📋 Method: ${requestOptions.method}`);

    // Make the request to Green API
    const response = await fetch(url, requestOptions);
    
    // Get response data
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText };
    }

    console.log(`✅ Response status: ${response.status}`);

    res.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    });

  } catch (error) {
    console.error('❌ Netlify function proxy error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Development proxy is running'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - POST /green-api-proxy`);
  console.log(`   - POST /.netlify/functions/green-api-proxy`);
  console.log(`   - GET /health`);
  console.log(`\n🔧 To use this proxy, update your Green API service to use:`);
  console.log(`   http://localhost:${PORT} in development mode`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  process.exit(0);
});
