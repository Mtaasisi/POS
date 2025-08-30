#!/usr/bin/env node

/**
 * LATS CHANCE API Server - Fixed Version
 * 
 * This server handles API requests for the LATS CHANCE application
 * with improved error handling for Green API 403 responses
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for nginx reverse proxy
app.set('trust proxy', true);

// Add headers for reverse proxy
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working', path: req.path, url: req.url });
});

// Test green-api-proxy route
app.get('/api/green-api-proxy.php/test', (req, res) => {
  res.json({ message: 'Green API proxy test route working', path: req.path, url: req.url });
});

// Green API proxy endpoint
app.all('/api/green-api-proxy', async (req, res) => {
  try {
    console.log('🔍 Green API proxy request:', req.method, req.path);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    
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
    
    // Use API token and default Green API URL
    const apiUrl = 'https://api.green-api.com';
    
    console.log(`🔑 Using API URL: ${apiUrl}`);
    
    // Build target URL with token as query parameter
    const targetUrl = `${apiUrl}/waInstance${instanceId}/${endpoint}?token=${token}`;
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
    console.log(`📤 Request options:`, requestOptions);
    
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
    
    // Forward the response with better error handling
    if (response.status === 403) {
      // If Green API returns 403, return a more helpful error message
      res.status(403).json({
        error: 'Invalid Green API credentials',
        message: 'The provided instance ID or API token is invalid. Please check your Green API credentials.',
        details: {
          instanceId,
          endpoint,
          greenApiStatus: response.status,
          greenApiResponse: responseText
        }
      });
    } else {
      res.status(response.status).send(responseText);
    }
    
  } catch (error) {
    console.error('❌ Green API proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test WhatsApp proxy route
app.get('/api/whatsapp/test/status/test-token', (req, res) => {
  res.json({ 
    message: 'WhatsApp proxy test route working', 
    path: req.path, 
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Alternative WhatsApp proxy route with different pattern to avoid nginx blocking
app.all('/api/whatsapp-proxy', async (req, res) => {
  try {
    console.log('🔍 WhatsApp proxy request:', req.method, req.path);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    
    // Get parameters from query string or body
    const { instanceId, endpoint, token } = req.method === 'GET' ? req.query : req.body;
    
    if (!instanceId || !endpoint || !token) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['instanceId', 'endpoint', 'token'],
        received: { instanceId, endpoint, token }
      });
    }
    
    console.log(`📱 Instance ID: ${instanceId}, Endpoint: ${endpoint}`);
    
    // Use API token and default Green API URL
    const apiUrl = 'https://api.green-api.com';
    
    console.log(`🔑 Using API URL: ${apiUrl}`);
    
    // Build target URL with token as query parameter
    const targetUrl = `${apiUrl}/waInstance${instanceId}/${endpoint}?token=${token}`;
    console.log(`🎯 Target URL: ${targetUrl}`);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Proxy/1.0',
      'Accept': 'application/json'
    };
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
      timeout: 30000
    };
    
    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 3) {
      const { instanceId: _, endpoint: __, token: ___, ...bodyData } = req.body;
      requestOptions.body = JSON.stringify(bodyData);
    }
    
    console.log(`📤 Forwarding request to Green API...`);
    console.log(`📤 Request options:`, requestOptions);
    
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
    
    // Forward the response with better error handling
    if (response.status === 403) {
      // If Green API returns 403, return a more helpful error message
      res.status(403).json({
        error: 'Invalid Green API credentials',
        message: 'The provided instance ID or API token is invalid. Please check your Green API credentials.',
        details: {
          instanceId,
          endpoint,
          greenApiStatus: response.status,
          greenApiResponse: responseText
        }
      });
    } else {
      res.status(response.status).send(responseText);
    }
    
  } catch (error) {
    console.error('❌ WhatsApp proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// New WhatsApp API proxy route with different pattern
app.all('/api/whatsapp/:instanceId/:endpoint/:token', async (req, res) => {
  try {
    console.log('🔍 WhatsApp API proxy request:', req.method, req.path);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    
    // Extract parameters from URL
    const { instanceId, endpoint, token } = req.params;
    console.log(`📱 Instance ID: ${instanceId}, Endpoint: ${endpoint}`);
    
    // Use API token from URL and default Green API URL
    const apiUrl = 'https://api.green-api.com';
    
    console.log(`🔑 Using API URL: ${apiUrl}`);
    
    // Build target URL with token as query parameter
    const targetUrl = `${apiUrl}/waInstance${instanceId}/${endpoint}?token=${token}`;
    console.log(`🎯 Target URL: ${targetUrl}`);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Proxy/1.0',
      'Accept': 'application/json'
    };
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
      timeout: 30000
    };
    
    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }
    
    console.log(`📤 Forwarding request to Green API...`);
    console.log(`📤 Request options:`, requestOptions);
    
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
    
    // Forward the response with better error handling
    if (response.status === 403) {
      // If Green API returns 403, return a more helpful error message
      res.status(403).json({
        error: 'Invalid Green API credentials',
        message: 'The provided instance ID or API token is invalid. Please check your Green API credentials.',
        details: {
          instanceId,
          endpoint,
          greenApiStatus: response.status,
          greenApiResponse: responseText
        }
      });
    } else {
      res.status(response.status).send(responseText);
    }
    
  } catch (error) {
    console.error('❌ WhatsApp API proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LATS CHANCE API Server (Fixed) running on port ${PORT}`);
  console.log(`💳 Beem Payment API: http://localhost:${PORT}/api/beem-payment`);
  console.log(`🔗 Beem Webhook: http://localhost:${PORT}/api/beem-webhook`);
  console.log(`📱 Green API Proxy: http://localhost:${PORT}/api/green-api-proxy`);
  console.log(`📱 WhatsApp Proxy: http://localhost:${PORT}/api/whatsapp-proxy`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
