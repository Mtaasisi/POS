// ZenoPay API Configuration
export const ZENOPAY_CONFIG = {
  // PHP server URL - change this to your actual server URL
  API_BASE_URL: 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    CREATE_ORDER: '/zenopay-create-order.php',
    CHECK_STATUS: '/zenopay-check-status.php',
    WEBHOOK: '/zenopay-webhook.php'
  },
  
  // Get full URL for an endpoint
  getUrl: (endpoint: string) => `${ZENOPAY_CONFIG.API_BASE_URL}${endpoint}`,
  
  // Get create order URL
  getCreateOrderUrl: () => ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.CREATE_ORDER),
  
  // Get check status URL
  getCheckStatusUrl: (orderId: string) => 
    `${ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.CHECK_STATUS)}?order_id=${orderId}`,
  
  // Get webhook URL
  getWebhookUrl: () => ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.WEBHOOK)
};

// Development vs Production configuration
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Get the appropriate API base URL
export const getApiBaseUrl = () => {
  if (isDevelopment()) {
    return 'http://localhost:8000'; // Local PHP server
  }
  return window.location.origin; // Same domain as the app
};
