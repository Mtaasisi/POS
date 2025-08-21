// Simple test webhook for debugging
exports.handler = async function(event, context) {
  console.log('Test webhook received:', JSON.stringify(event.body, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      data: JSON.parse(event.body || '{}')
    })
  };
};
