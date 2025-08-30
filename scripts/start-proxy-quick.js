#!/usr/bin/env node

/**
 * Quick Proxy Server Starter
 * This script starts the development proxy server with better error handling
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 8888;

console.log('🚀 Starting WhatsApp Proxy Server...\n');

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Green API proxy endpoint
app.post('/green-api-proxy', async (req, res) => {
  try {
    const { path, method, body, headers } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Construct the full URL
    const baseUrl = 'https://7105.api.greenapi.com';
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

// Netlify function proxy endpoint (for compatibility)
app.post('/.netlify/functions/green-api-proxy', async (req, res) => {
  try {
    const { path, method, body, headers } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Construct the full URL
    const baseUrl = 'https://7105.api.greenapi.com';
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

// Start the server
app.listen(PORT, () => {
  console.log(`✅ WhatsApp Proxy Server is running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/green-api-proxy`);
  console.log(`📱 Netlify endpoint: http://localhost:${PORT}/.netlify/functions/green-api-proxy`);
  console.log('\n💡 Keep this terminal open while using WhatsApp features');
  console.log('🛑 Press Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WhatsApp Proxy Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WhatsApp Proxy Server...');
  process.exit(0);
});
