const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  try {
    const { path, method, body, headers, baseUrl } = JSON.parse(event.body || '{}');
    
    if (!path) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Path is required' }),
      };
    }

    // Construct the full URL
    const apiBaseUrl = baseUrl || 'https://api.green-api.com';
    const url = `${apiBaseUrl}${path}`;

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
    console.log(`📦 Headers:`, requestOptions.headers);

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
    console.log(`📄 Response data:`, responseData);

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: response.ok,
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      }),
    };

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};
