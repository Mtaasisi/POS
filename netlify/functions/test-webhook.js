// Simple test webhook for debugging
export default async function handler(event, context) {
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
      message: 'Test webhook working!',
      timestamp: new Date().toISOString(),
      receivedData: event.body ? JSON.parse(event.body) : null
    })
  };
}
