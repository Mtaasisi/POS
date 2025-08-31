# Instagram DM Error Handling Guide

## Overview

This guide covers error handling for Instagram Direct Messaging using the **Instagram API with Facebook Login** approach. Proper error handling ensures reliable messaging and good user experience.

## Common Instagram API Errors

### 1. Authentication Errors

#### Invalid Access Token (Error #190)
```typescript
// Error response
{
  "error": {
    "message": "Invalid OAuth access token.",
    "type": "OAuthException", 
    "code": 190,
    "fbtrace_id": "xyz123"
  }
}

// Handling
if (error.code === 190) {
  // Token expired or invalid
  await refreshAccessToken();
  // Or redirect to re-authentication
  redirectToLogin();
}
```

#### Insufficient Permissions (Error #10)
```typescript
// Error response  
{
  "error": {
    "message": "Application does not have permission for this action",
    "type": "OAuthException",
    "code": 10
  }
}

// Handling
if (error.code === 10) {
  showError('Missing Instagram messaging permissions. Please reconnect your account.');
  // Guide user to grant additional permissions
}
```

### 2. Messaging Errors

#### User Has Not Opted In (Error #2018001)
```typescript
// Error response
{
  "error": {
    "message": "This person isn't available right now",
    "type": "OAuthException", 
    "code": 2018001
  }
}

// Handling
if (error.code === 2018001) {
  showWarning('User must message your account first before you can send messages.');
  // Disable message composer for this user
  setCanMessage(false);
}
```

#### Message Outside 24-Hour Window (Error #2018108)
```typescript
// Error response
{
  "error": {
    "message": "This message is sent outside of allowed window",
    "type": "OAuthException",
    "code": 2018108
  }
}

// Handling  
if (error.code === 2018108) {
  // Can only send with message tags
  const taggedMessage = {
    ...originalMessage,
    tag: 'CONFIRMED_EVENT_UPDATE' // Use appropriate tag
  };
  
  await sendTaggedMessage(recipientId, taggedMessage);
}
```

### 3. Rate Limiting Errors

#### Rate Limit Exceeded (Error #613)
```typescript
// Error response
{
  "error": {
    "message": "Calls to this api have exceeded the rate limit",
    "type": "OAuthException",
    "code": 613
  }
}

// Handling with exponential backoff
const handleRateLimit = async (retryCount = 0) => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  if (retryCount >= maxRetries) {
    throw new Error('Max retries reached for rate limit');
  }
  
  const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    return await sendMessage(recipientId, message);
  } catch (error) {
    if (error.code === 613) {
      return handleRateLimit(retryCount + 1);
    }
    throw error;
  }
};
```

### 4. Template Errors

#### Invalid Template Format (Error #100)
```typescript
// Error response
{
  "error": {
    "message": "Invalid parameter",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 2018001
  }
}

// Template validation before sending
const validateTemplate = (template: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (template.template_type === 'generic') {
    // Check element count
    if (!template.elements || template.elements.length === 0) {
      errors.push('Generic template requires at least one element');
    }
    
    if (template.elements && template.elements.length > 10) {
      errors.push('Generic template cannot have more than 10 elements');
    }
    
    // Check each element
    template.elements?.forEach((element: any, index: number) => {
      if (!element.title) {
        errors.push(`Element ${index + 1} missing required title`);
      }
      
      if (element.title && element.title.length > 80) {
        errors.push(`Element ${index + 1} title exceeds 80 characters`);
      }
      
      if (element.subtitle && element.subtitle.length > 80) {
        errors.push(`Element ${index + 1} subtitle exceeds 80 characters`);
      }
      
      if (element.buttons && element.buttons.length > 3) {
        errors.push(`Element ${index + 1} cannot have more than 3 buttons`);
      }
      
      // Validate buttons
      element.buttons?.forEach((button: any, btnIndex: number) => {
        if (!button.title || button.title.length > 20) {
          errors.push(`Element ${index + 1}, button ${btnIndex + 1} title invalid (max 20 chars)`);
        }
        
        if (button.type === 'web_url' && !button.url) {
          errors.push(`Element ${index + 1}, button ${btnIndex + 1} missing URL`);
        }
        
        if (button.type === 'postback' && !button.payload) {
          errors.push(`Element ${index + 1}, button ${btnIndex + 1} missing payload`);
        }
      });
    });
  }
  
  return { valid: errors.length === 0, errors };
};
```

## Instagram-Specific Error Scenarios

### User Blocks Your Account

```typescript
// Error response
{
  "error": {
    "message": "User unavailable",
    "type": "OAuthException",
    "code": 2018027
  }
}

// Detection and handling
const checkUserAvailability = async (userId: string): Promise<boolean> => {
  try {
    await instagramApiService.getUserProfile(userId);
    return true;
  } catch (error) {
    if (error.code === 2018027) {
      // User blocked the account
      markUserAsBlocked(userId);
      return false;
    }
    throw error;
  }
};
```

### Account Restrictions

```typescript
// Error response for restricted account
{
  "error": {
    "message": "The Instagram account is restricted from messaging",
    "type": "OAuthException", 
    "code": 2018145
  }
}

// Handling account restrictions
if (error.code === 2018145) {
  showError('Instagram account temporarily restricted from messaging. Contact Instagram support.');
  // Disable messaging features
  setMessagingDisabled(true);
  // Log for monitoring
  logAccountRestriction();
}
```

### Invalid Instagram Account

```typescript
// Error when Instagram account not found or not professional
{
  "error": {
    "message": "Invalid Instagram account ID",
    "type": "OAuthException",
    "code": 100
  }
}

// Validation before setup
const validateInstagramAccount = async (accountId: string): Promise<boolean> => {
  try {
    const account = await instagramApiService.getAccountInfo();
    
    // Check if account is professional
    if (account.data.account_type === 'PERSONAL') {
      throw new Error('Instagram account must be converted to Business or Creator account');
    }
    
    return true;
  } catch (error) {
    if (error.code === 100) {
      throw new Error('Invalid Instagram account ID or account not accessible');
    }
    throw error;
  }
};
```

## Facebook Page Integration Errors

### Page Not Connected to Instagram

```typescript
// Error when Facebook Page not linked to Instagram
{
  "error": {
    "message": "Page not connected to Instagram account",
    "type": "OAuthException",
    "code": 2018001
  }
}

// Validation and handling
const validatePageInstagramConnection = async (pageId: string, instagramId: string) => {
  try {
    const { data } = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
    
    if (!data.instagram_business_account || data.instagram_business_account.id !== instagramId) {
      throw new Error('Facebook Page is not connected to the specified Instagram account');
    }
    
    return true;
  } catch (error) {
    showError('Please connect your Facebook Page to your Instagram account first');
    // Provide setup instructions
    showFacebookPageSetupGuide();
    return false;
  }
};
```

### Missing Page Permissions

```typescript
// Error when page access token lacks permissions
{
  "error": {
    "message": "Insufficient permissions for this page",
    "type": "OAuthException",
    "code": 190
  }
}

// Check page permissions
const validatePagePermissions = async (pageId: string) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const { data } = await response.json();
    
    const page = data.find((p: any) => p.id === pageId);
    if (!page) {
      throw new Error('Page not found in accessible pages');
    }
    
    const requiredPerms = ['MANAGE', 'CREATE_CONTENT', 'MODERATE'];
    const hasPermissions = requiredPerms.every(perm => 
      page.perms?.includes(perm)
    );
    
    if (!hasPermissions) {
      throw new Error('Insufficient page permissions for messaging');
    }
    
    return true;
  } catch (error) {
    showError('Missing Facebook Page permissions. Please grant full page access.');
    return false;
  }
};
```

## Message Delivery Failures

### Network/Connectivity Issues

```typescript
const handleNetworkErrors = async (error: any, retryFunction: Function) => {
  const networkErrors = ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_FAILED'];
  
  if (networkErrors.includes(error.type)) {
    // Implement retry with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return await retryFunction();
      } catch (retryError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
        }
      }
    }
  }
  
  throw error;
};
```

### Message Queue for Failed Sends

```typescript
interface FailedMessage {
  id: string;
  recipientId: string;
  content: any;
  attemptCount: number;
  lastAttempt: Date;
  error: any;
}

class MessageFailureHandler {
  private failedMessages: FailedMessage[] = [];
  private retryInterval: NodeJS.Timeout | null = null;
  
  addFailedMessage(recipientId: string, content: any, error: any) {
    this.failedMessages.push({
      id: `failed_${Date.now()}_${Math.random()}`,
      recipientId,
      content,
      attemptCount: 1,
      lastAttempt: new Date(),
      error
    });
    
    this.startRetryProcess();
  }
  
  private startRetryProcess() {
    if (this.retryInterval) return;
    
    this.retryInterval = setInterval(async () => {
      const toRetry = this.failedMessages.filter(msg => 
        msg.attemptCount < 3 && 
        Date.now() - msg.lastAttempt.getTime() > 5 * 60 * 1000 // 5 minutes
      );
      
      for (const message of toRetry) {
        try {
          await this.retryMessage(message);
          this.removeFailedMessage(message.id);
        } catch (error) {
          message.attemptCount++;
          message.lastAttempt = new Date();
          message.error = error;
          
          if (message.attemptCount >= 3) {
            // Give up after 3 attempts
            this.logPermanentFailure(message);
            this.removeFailedMessage(message.id);
          }
        }
      }
      
      if (this.failedMessages.length === 0) {
        clearInterval(this.retryInterval!);
        this.retryInterval = null;
      }
    }, 60 * 1000); // Check every minute
  }
  
  private async retryMessage(message: FailedMessage) {
    // Retry based on content type
    if (typeof message.content === 'string') {
      return await instagramApiService.sendTextMessage(message.recipientId, message.content);
    } else if (message.content.template_type) {
      return await instagramApiService.sendGenericTemplate(message.recipientId, message.content);
    }
  }
}
```

## Error Recovery Strategies

### Graceful Degradation

```typescript
const sendMessageWithFallback = async (recipientId: string, primaryContent: any, fallbackText: string) => {
  try {
    // Try primary message (template/rich content)
    if (primaryContent.template_type) {
      return await instagramApiService.sendGenericTemplate(recipientId, primaryContent);
    } else if (primaryContent.quick_replies) {
      return await instagramApiService.sendQuickReplies(
        recipientId, 
        primaryContent.text, 
        primaryContent.quick_replies
      );
    }
  } catch (error) {
    console.warn('Primary message failed, sending fallback:', error);
    
    // Fallback to simple text
    try {
      return await instagramApiService.sendTextMessage(recipientId, fallbackText);
    } catch (fallbackError) {
      console.error('Fallback message also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

// Usage
await sendMessageWithFallback(
  userId,
  complexTemplate,
  "Thanks for your message! I'll get back to you soon."
);
```

### Auto-Retry Logic

```typescript
class InstagramErrorHandler {
  private static retryableErrors = [613, 1, 2]; // Rate limit, temporary, unknown errors
  
  static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry non-retryable errors
        if (!this.retryableErrors.includes(error.code)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Usage
const sendMessage = async (recipientId: string, text: string) => {
  return InstagramErrorHandler.withRetry(
    () => instagramApiService.sendTextMessage(recipientId, text),
    3, // Max 3 retries
    1000 // 1 second base delay
  );
};
```

## Business Logic Errors

### Stock/Product Availability

```typescript
const handleProductInquiry = async (recipientId: string, productId: string) => {
  try {
    const product = await getProduct(productId);
    
    if (!product) {
      await instagramApiService.sendTextMessage(
        recipientId, 
        'Sorry, I couldn\'t find that product. Could you provide more details or try browsing our catalog?'
      );
      return;
    }
    
    if (!product.isActive) {
      await instagramApiService.sendTextMessage(
        recipientId, 
        'This product is currently unavailable. Would you like to see similar items or be notified when it\'s back?'
      );
      return;
    }
    
    if (product.totalQuantity === 0) {
      const outOfStockTemplate = {
        template_type: 'button',
        text: `${product.name} is currently out of stock. 😔`,
        buttons: [
          { type: 'postback', title: 'Notify When Back', payload: `NOTIFY_${productId}` },
          { type: 'postback', title: 'Similar Items', payload: `SIMILAR_${productId}` },
          { type: 'web_url', title: 'Browse All', url: 'https://yourstore.com/products' }
        ]
      };
      
      await instagramApiService.sendButtonTemplate(recipientId, outOfStockTemplate);
      return;
    }
    
    // Product available - send details
    await sendProductDetails(recipientId, product);
    
  } catch (error) {
    console.error('Error handling product inquiry:', error);
    await instagramApiService.sendTextMessage(
      recipientId,
      'I\'m having trouble accessing product information right now. Please try again in a few minutes or visit our website.'
    );
  }
};
```

### Order Processing Errors

```typescript
const handleOrderInquiry = async (recipientId: string, orderNumber: string) => {
  try {
    const order = await getOrder(orderNumber);
    
    if (!order) {
      await instagramApiService.sendQuickReplies(
        recipientId,
        'I couldn\'t find that order number. This might help:',
        [
          { content_type: 'text', title: 'Check Spelling', payload: 'ORDER_HELP_SPELLING' },
          { content_type: 'text', title: 'Find My Orders', payload: 'ORDER_HELP_FIND' },
          { content_type: 'text', title: 'Contact Support', payload: 'HUMAN_AGENT' }
        ]
      );
      return;
    }
    
    // Send order status
    await sendOrderStatus(recipientId, order);
    
  } catch (error) {
    if (error.code === 'PERMISSION_DENIED') {
      await instagramApiService.sendTextMessage(
        recipientId,
        'For security, I can only share order details with the account holder. Please verify your identity through our website.'
      );
    } else {
      await instagramApiService.sendTextMessage(
        recipientId,
        'I\'m having trouble accessing order information. Please contact our support team for immediate assistance.'
      );
    }
  }
};
```

## Error Monitoring & Alerting

### Error Tracking System

```typescript
interface ErrorLog {
  timestamp: Date;
  error_code: number;
  error_message: string;
  user_id: string;
  operation: string;
  retry_count: number;
  resolved: boolean;
}

class InstagramErrorLogger {
  private static errors: ErrorLog[] = [];
  
  static log(error: any, context: { userId?: string; operation: string; retryCount?: number }) {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      error_code: error.code || 0,
      error_message: error.message || 'Unknown error',
      user_id: context.userId || 'unknown',
      operation: context.operation,
      retry_count: context.retryCount || 0,
      resolved: false
    };
    
    this.errors.push(errorLog);
    
    // Alert for critical errors
    if (this.isCriticalError(error)) {
      this.alertCriticalError(errorLog);
    }
    
    // Clean old logs
    this.cleanup();
  }
  
  private static isCriticalError(error: any): boolean {
    const criticalCodes = [190, 2018145, 10]; // Auth issues, restrictions
    return criticalCodes.includes(error.code);
  }
  
  private static alertCriticalError(errorLog: ErrorLog) {
    // Send to monitoring service
    console.error('🚨 CRITICAL Instagram Error:', errorLog);
    
    // Could integrate with:
    // - Sentry
    // - DataDog  
    // - Email alerts
    // - Slack notifications
  }
  
  static getErrorStats() {
    const last24Hours = this.errors.filter(
      error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    return {
      total_errors_24h: last24Hours.length,
      critical_errors_24h: last24Hours.filter(e => this.isCriticalError(e)).length,
      most_common_error: this.getMostCommonError(last24Hours),
      error_rate: last24Hours.length / 1440 // per minute
    };
  }
}
```

### Health Checks

```typescript
const instagramHealthCheck = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: any[];
}> => {
  const checks = [];
  
  try {
    // Test basic API connectivity
    const accountCheck = await instagramApiService.getAccountInfo();
    checks.push({
      name: 'Account API',
      status: accountCheck.ok ? 'pass' : 'fail',
      response_time: Date.now() - start,
      error: accountCheck.error
    });
  } catch (error) {
    checks.push({
      name: 'Account API', 
      status: 'fail',
      error: error.message
    });
  }
  
  try {
    // Test webhook connectivity (if configured)
    const webhookTest = await testWebhookConnectivity();
    checks.push({
      name: 'Webhook',
      status: webhookTest ? 'pass' : 'fail'
    });
  } catch (error) {
    checks.push({
      name: 'Webhook',
      status: 'fail', 
      error: error.message
    });
  }
  
  // Test message sending capability
  try {
    // Send test message to yourself
    const testResult = await sendTestMessage();
    checks.push({
      name: 'Message Sending',
      status: testResult ? 'pass' : 'fail'
    });
  } catch (error) {
    checks.push({
      name: 'Message Sending',
      status: 'fail',
      error: error.message  
    });
  }
  
  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const status = failedChecks === 0 ? 'healthy' : 
                failedChecks <= 1 ? 'degraded' : 'unhealthy';
  
  return { status, checks };
};
```

## User Experience During Errors

### Error Messages to Users

```typescript
const userFriendlyErrors = {
  // Technical errors - don't expose details
  general: 'I\'m experiencing some technical difficulties. Please try again in a few minutes.',
  
  // Rate limits - set expectations  
  rate_limit: 'I\'m getting a lot of messages right now! I\'ll respond as soon as possible.',
  
  // Service unavailable
  service_down: 'Our messaging service is temporarily unavailable. You can also reach us at [phone] or [email].',
  
  // Feature not available
  feature_unavailable: 'That feature isn\'t available right now, but I can help you with [alternative].',
  
  // Account issues
  account_issue: 'There\'s an issue with your account access. Please contact our support team for assistance.'
};
```

### Error Recovery UI

```typescript
// Component for handling errors gracefully
const ErrorRecoveryComponent: React.FC<{ error: any; onRetry: () => void }> = ({ error, onRetry }) => {
  const getErrorAction = (errorCode: number) => {
    switch (errorCode) {
      case 190: // Auth error
        return { 
          text: 'Reconnect Account', 
          action: () => window.location.href = '/instagram/connect' 
        };
      case 613: // Rate limit
        return { 
          text: 'Try Again Later', 
          action: () => setTimeout(onRetry, 60000) 
        };
      default:
        return { 
          text: 'Retry', 
          action: onRetry 
        };
    }
  };
  
  const errorAction = getErrorAction(error.code);
  
  return (
    <div className="error-recovery">
      <p>Unable to send message: {error.message}</p>
      <button onClick={errorAction.action}>
        {errorAction.text}
      </button>
    </div>
  );
};
```

## Production Error Handling Checklist

### ✅ Pre-Production Setup

- [ ] Error logging configured
- [ ] Monitoring alerts set up  
- [ ] Retry logic implemented
- [ ] Rate limit handling
- [ ] User-friendly error messages
- [ ] Health check endpoints
- [ ] Fallback messaging paths

### ✅ Error Response Templates

- [ ] Authentication failure responses
- [ ] Rate limit user notifications
- [ ] Service unavailable messages
- [ ] Feature limitation explanations
- [ ] Account restriction notices

### ✅ Monitoring Dashboards

- [ ] Error rate tracking
- [ ] Critical error alerts
- [ ] Response time monitoring
- [ ] Success/failure ratios
- [ ] User impact metrics

This covers comprehensive error handling for Instagram DMs with Facebook Login approach. The key is to fail gracefully and always provide users with clear next steps.