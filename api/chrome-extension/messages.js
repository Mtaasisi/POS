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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId, message, type = 'text' } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json(
        { error: 'Missing required fields: chatId and message' }
      );
    }

    const result = await chromeExtensionService.sendMessage({
      chatId,
      message,
      type
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
