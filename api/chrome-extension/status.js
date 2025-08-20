const { chromeExtensionService } = require('../../src/services/chromeExtensionService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, X-Client-Info');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = await chromeExtensionService.getStatus();
    
    res.status(200).json({
      success: true,
      data: {
        isConnected: status.isConnected,
        queueLength: status.queueLength || 0,
        apiKey: status.apiKey ? 'Configured' : 'Not configured',
        lastActivity: status.lastActivity || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get status',
      data: {
        isConnected: false,
        queueLength: 0,
        apiKey: 'Error',
        lastActivity: new Date().toISOString()
      }
    });
  }
};
