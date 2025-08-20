import { chromeExtensionService } from '../../src/services/chromeExtensionService.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('📊 Chrome extension status API called:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = await chromeExtensionService.getStatus();
    res.status(200).json({ 
      success: true, 
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Chrome extension status API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
