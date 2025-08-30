#!/usr/bin/env node

/**
 * LATS CHANCE API Server
 * 
 * This server handles API requests for the LATS CHANCE application
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// WhatsApp API proxy endpoint
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { instanceId, apiToken, phoneNumber, message, host } = req.body;
    
    console.log(`📱 Proxying WhatsApp message from instance: ${instanceId}`);
    console.log(`📤 To: ${phoneNumber}`);
    console.log(`📝 Message: ${message}`);
    console.log(`🔑 API Token: ${apiToken ? apiToken.substring(0, 10) + '...' : 'NOT PROVIDED'}`);
    console.log(`🌐 Host: ${host}`);
    
    // Green API URL format: {{apiUrl}}/waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
    const url = `${host}/waInstance${instanceId}/sendMessage/${apiToken}`;
    
    console.log(`🎯 Full URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: `${phoneNumber}@c.us`,
        message: message
      })
    });
    
    console.log(`📥 Green API response status: ${response.status} ${response.statusText}`);
    
    // Get response as text first
    const responseText = await response.text();
    console.log(`📥 Green API response text: "${responseText}"`);
    
    let result;
    try {
      // Try to parse as JSON if there's content
      if (responseText.trim()) {
        result = JSON.parse(responseText);
      } else {
        result = { message: 'Empty response from Green API' };
      }
    } catch (parseError) {
      console.log(`⚠️ Could not parse response as JSON: ${parseError.message}`);
      result = { 
        message: 'Non-JSON response from Green API',
        rawResponse: responseText 
      };
    }
    
    console.log(`✅ WhatsApp API response:`, result);
    
    res.json({
      success: response.ok,
      data: result,
      status: response.status,
      responseText: responseText
    });
    
  } catch (error) {
    console.error('❌ Error proxying WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WhatsApp API check state endpoint
app.post('/api/whatsapp/check-state', async (req, res) => {
  try {
    const { instanceId, apiToken, host } = req.body;
    
    console.log(`🔍 Proxying state check for instance: ${instanceId}`);
    console.log(`🔑 API Token: ${apiToken ? apiToken.substring(0, 10) + '...' : 'NOT PROVIDED'}`);
    console.log(`🌐 Host: ${host}`);
    
    // Green API URL format: {{apiUrl}}/waInstance{{idInstance}}/getStateInstance/{{apiTokenInstance}}
    const url = `${host}/waInstance${instanceId}/getStateInstance/${apiToken}`;
    
    console.log(`🎯 Full URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📥 Green API response status: ${response.status} ${response.statusText}`);
    
    // Get response as text first
    const responseText = await response.text();
    console.log(`📥 Green API response text: "${responseText}"`);
    
    let result;
    try {
      // Try to parse as JSON if there's content
      if (responseText.trim()) {
        result = JSON.parse(responseText);
      } else {
        result = { message: 'Empty response from Green API' };
      }
    } catch (parseError) {
      console.log(`⚠️ Could not parse response as JSON: ${parseError.message}`);
      result = { 
        message: 'Non-JSON response from Green API',
        rawResponse: responseText 
      };
    }
    
    console.log(`✅ WhatsApp state check response:`, result);
    
    res.json({
      success: response.ok,
      data: result,
      status: response.status,
      responseText: responseText
    });
    
  } catch (error) {
    console.error('❌ Error checking WhatsApp state:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      stateInstance: 'error',
      status: 'proxy_error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
