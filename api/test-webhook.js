/**
 * Test Webhook Vercel Function
 * Simple test endpoint to verify webhook functionality
 */

export default async function handler(req, res) {
  console.log('🧪 Test webhook received:', new Date().toISOString());
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Test webhook working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      receivedData: req.body || null,
      headers: req.headers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
