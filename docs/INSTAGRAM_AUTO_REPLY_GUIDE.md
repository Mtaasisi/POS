# Instagram Auto-Reply Configuration Guide

## Overview

This guide explains how to set up and optimize automated responses for Instagram DMs using the Facebook Login approach. Auto-replies help maintain customer engagement when you can't respond immediately.

## Auto-Reply System Components

### 1. Trigger Keywords
Words or phrases that activate auto-replies when found in user messages.

### 2. Response Types
- **Text**: Simple text message
- **Quick Reply**: Text with action buttons
- **Template**: Rich structured messages

### 3. Priority System
Rules with higher priority (1-10) are matched first.

### 4. Business Hours
Auto-replies can be time-restricted to business hours only.

## Setting Up Auto-Reply Rules

### Basic Text Auto-Reply

```typescript
const basicRule = {
  trigger_keywords: ['hello', 'hi', 'hey', 'good morning'],
  response_type: 'text',
  response_content: 'Hi there! 👋 Thanks for reaching out. I\'ll get back to you as soon as possible. How can I help you today?',
  is_active: true,
  priority: 5
};

instagramActions.addAutoReplyRule(basicRule);
```

### Quick Reply Auto-Response

```typescript
const supportRule = {
  trigger_keywords: ['help', 'support', 'problem', 'issue', 'question'],
  response_type: 'quick_reply',
  response_content: {
    text: 'I\'m here to help! What type of assistance do you need?',
    replies: [
      { content_type: 'text', title: 'Order Help', payload: 'SUPPORT_ORDER' },
      { content_type: 'text', title: 'Product Info', payload: 'SUPPORT_PRODUCT' },
      { content_type: 'text', title: 'Technical', payload: 'SUPPORT_TECH' },
      { content_type: 'text', title: 'Talk to Human', payload: 'HUMAN_AGENT' }
    ]
  },
  is_active: true,
  priority: 8
};
```

### Product Inquiry Auto-Reply

```typescript
const productRule = {
  trigger_keywords: ['product', 'price', 'cost', 'buy', 'purchase', 'catalog'],
  response_type: 'template',
  response_content: {
    template_type: 'button',
    text: '🛍️ Interested in our products? Here\'s how you can explore our catalog:',
    buttons: [
      { type: 'web_url', title: 'Browse Catalog', url: 'https://yourstore.com/products' },
      { type: 'postback', title: 'Featured Items', payload: 'PRODUCTS_FEATURED' },
      { type: 'postback', title: 'New Arrivals', payload: 'PRODUCTS_NEW' }
    ]
  },
  is_active: true,
  priority: 7
};
```

## Advanced Keyword Strategies

### Exact Match vs Partial Match

```typescript
// Partial match (default) - finds keyword anywhere in message
trigger_keywords: ['order']
// Matches: "I have an order question", "My order is late", "order status"

// Use specific phrases for exact intent
trigger_keywords: ['order status', 'where is my order', 'track my order']
// More precise matching for specific responses
```

### Keyword Variations

```typescript
// Cover different ways users express the same intent
const greetingKeywords = [
  // Basic greetings
  'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
  // Casual
  'sup', 'what\'s up', 'howdy',
  // Different languages
  'hola', 'bonjour', 'ciao',
  // Emojis
  '👋', '😊', '🙋'
];

const supportKeywords = [
  // Direct requests
  'help', 'support', 'assistance',
  // Problem expressions
  'problem', 'issue', 'trouble', 'error',
  // Question formats
  'question', 'ask', 'wonder', 'confused',
  // Urgency
  'urgent', 'emergency', 'asap'
];
```

### Negative Keywords

```typescript
// Avoid auto-replying to certain contexts
const shouldSkipAutoReply = (message: string): boolean => {
  const skipKeywords = [
    'unsubscribe', 'stop', 'no thanks', 'not interested',
    'already solved', 'nevermind', 'found it',
    'spam', 'wrong number'
  ];
  
  return skipKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};
```

## Business Hours Configuration

### Basic Business Hours

```typescript
const businessHours = {
  enabled: true,
  timezone: 'America/New_York',
  schedule: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: true },
    sunday: { start: '00:00', end: '00:00', enabled: false }
  }
};
```

### After-Hours Auto-Reply

```typescript
const afterHoursRule = {
  trigger_keywords: ['*'], // Matches any message
  response_type: 'quick_reply',
  response_content: {
    text: '🌙 Thanks for your message! We\'re currently outside business hours.\n\nOur team will respond first thing tomorrow. For urgent matters:',
    replies: [
      { content_type: 'text', title: 'Emergency Support', payload: 'EMERGENCY' },
      { content_type: 'text', title: 'View Hours', payload: 'BUSINESS_HOURS' },
      { content_type: 'text', title: 'Self-Service', payload: 'SELF_SERVICE' }
    ]
  },
  is_active: true,
  priority: 1, // Low priority - only if no other rules match
  business_hours_only: false // This rule works outside hours
};
```

## Rule Priority & Conflicts

### Priority Examples

```typescript
const prioritySystem = [
  { priority: 10, rule: 'Emergency/urgent keywords' },
  { priority: 9, rule: 'Specific product inquiries' },
  { priority: 8, rule: 'Support requests' },
  { priority: 7, rule: 'Order status inquiries' },
  { priority: 6, rule: 'General product questions' },
  { priority: 5, rule: 'Greetings and hello' },
  { priority: 4, rule: 'Business information' },
  { priority: 3, rule: 'FAQ topics' },
  { priority: 2, rule: 'General fallback' },
  { priority: 1, rule: 'After-hours message' }
];
```

### Handling Rule Conflicts

```typescript
// Multiple rules might match - highest priority wins
const conflictExample = {
  message: 'hello, I need help with my order',
  matchingRules: [
    { keywords: ['hello'], priority: 5, type: 'greeting' },
    { keywords: ['help'], priority: 8, type: 'support' },
    { keywords: ['order'], priority: 7, type: 'order_inquiry' }
  ],
  // Result: Support rule wins (priority 8)
  selectedRule: 'support'
};
```

## Smart Auto-Reply Features

### Context-Aware Responses

```typescript
const contextualAutoReply = {
  // First-time user
  newUser: {
    text: 'Welcome to [Store Name]! 🎉\n\nSince this is your first time messaging us, here\'s what I can help with:',
    replies: [
      { content_type: 'text', title: 'Browse Products', payload: 'FIRST_VISIT_PRODUCTS' },
      { content_type: 'text', title: 'Learn About Us', payload: 'FIRST_VISIT_ABOUT' },
      { content_type: 'text', title: 'Special Offers', payload: 'FIRST_VISIT_OFFERS' }
    ]
  },
  
  // Returning customer
  returningUser: {
    text: 'Great to hear from you again! 😊\n\nHow can I help you today?',
    replies: [
      { content_type: 'text', title: 'New Products', payload: 'RETURNING_NEW' },
      { content_type: 'text', title: 'Order Status', payload: 'RETURNING_ORDER' },
      { content_type: 'text', title: 'Support', payload: 'RETURNING_SUPPORT' }
    ]
  }
};
```

### Frequency Limiting

```typescript
// Don't spam users with auto-replies
const frequencyLimits = {
  maxAutoRepliesPerHour: 3,
  maxAutoRepliesPerDay: 10,
  cooldownPeriod: 30 * 60 * 1000, // 30 minutes
  
  // Check before sending auto-reply
  canSendAutoReply: (userId: string): boolean => {
    const lastReplies = getRecentAutoReplies(userId);
    const recentCount = lastReplies.filter(
      reply => Date.now() - reply.timestamp < 60 * 60 * 1000
    ).length;
    
    return recentCount < frequencyLimits.maxAutoRepliesPerHour;
  }
};
```

## Advanced Auto-Reply Patterns

### Intent Recognition

```typescript
const intentBasedRules = [
  {
    intent: 'product_inquiry',
    keywords: ['price', 'cost', 'how much', 'available', 'in stock'],
    response: createProductInquiryResponse
  },
  {
    intent: 'order_tracking',
    keywords: ['order', 'shipped', 'delivery', 'tracking', 'when'],
    response: createOrderTrackingResponse
  },
  {
    intent: 'complaint',
    keywords: ['disappointed', 'unhappy', 'wrong', 'defective', 'broken'],
    response: createComplaintResponse,
    escalate: true // Flag for human review
  }
];
```

### Seasonal/Event-Based Rules

```typescript
const seasonalRules = {
  blackFriday: {
    active_dates: ['2024-11-29', '2024-12-02'],
    rule: {
      trigger_keywords: ['sale', 'discount', 'deal', 'price'],
      response_type: 'template',
      response_content: {
        template_type: 'button',
        text: '🖤 BLACK FRIDAY SALE! 🛍️\n\nUp to 70% off everything!\nSale ends Monday at midnight.',
        buttons: [
          { type: 'web_url', title: 'Shop Sale', url: 'https://store.com/black-friday' },
          { type: 'postback', title: 'Best Deals', payload: 'BF_BEST_DEALS' }
        ]
      },
      priority: 10
    }
  }
};
```

## Performance Monitoring

### Auto-Reply Analytics

```typescript
const autoReplyMetrics = {
  rule_id: 'greeting_001',
  triggers_today: 45,
  response_rate: 0.82, // 82% of users responded to auto-reply
  escalation_rate: 0.15, // 15% needed human agent
  satisfaction_score: 4.2, // If you collect feedback
  avg_conversation_length: 3.5, // Messages after auto-reply
  conversion_rate: 0.08 // 8% made purchase after auto-reply
};
```

### A/B Testing Auto-Replies

```typescript
const abTestAutoReplies = {
  test_name: 'greeting_optimization',
  variants: {
    formal: {
      text: 'Thank you for contacting us. How may I assist you today?',
      response_rate: 0.65
    },
    casual: {
      text: 'Hey! 👋 Thanks for the message. What can I help you with?',
      response_rate: 0.78
    },
    emoji_heavy: {
      text: '🎉 Hi there! 😊 Thanks for reaching out! 💬 How can I help? 🤔',
      response_rate: 0.71
    }
  },
  winner: 'casual' // 78% response rate
};
```

## Compliance & Best Practices

### Instagram Messaging Rules

1. **24-Hour Window**: Can message users freely for 24 hours after they message you
2. **User Consent**: Users must initiate conversation or opt-in
3. **No Spam**: Don't send unsolicited promotional content
4. **Opt-Out**: Always provide unsubscribe option

### Auto-Reply Compliance

```typescript
const complianceAutoReply = {
  // Always include opt-out
  text: 'This is an automated message. Reply STOP to unsubscribe from auto-replies.',
  
  // Respect user preferences
  checkUserPreferences: (userId: string) => {
    const prefs = getUserPreferences(userId);
    return !prefs.auto_reply_disabled;
  },
  
  // Log for compliance
  logAutoReply: (userId: string, ruleId: string) => {
    console.log(`Auto-reply sent: User ${userId}, Rule ${ruleId}, Time ${new Date().toISOString()}`);
  }
};
```

## Testing Auto-Reply Rules

### Rule Testing Framework

```typescript
const testAutoReplyRule = (rule: AutoReplyRule, testCases: string[]) => {
  const results = testCases.map(message => {
    const matches = rule.trigger_keywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return {
      message,
      matches,
      keyword_matched: rule.trigger_keywords.find(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      )
    };
  });
  
  console.log('Rule Test Results:', results);
  return results;
};

// Test greeting rule
testAutoReplyRule(greetingRule, [
  'Hello there!',
  'Hi, I have a question',
  'Hey what\'s up',
  'Good morning',
  'I need help' // Should not match greeting rule
]);
```

### Edge Case Testing

```typescript
const edgeCases = [
  // Empty messages
  '',
  
  // Only emojis
  '😊😊😊',
  
  // Very long messages
  'hello '.repeat(100),
  
  // Mixed languages
  'hello hola bonjour',
  
  // Special characters
  'hello!!! ???',
  
  // Keyword in context where it shouldn't trigger
  'I don\'t want to say hello to that person'
];
```

## Rule Optimization Strategies

### Keyword Optimization

```typescript
// Use phrase matching for better accuracy
const improvedKeywords = {
  // Instead of just 'order'
  old: ['order'],
  
  // Use specific phrases
  new: ['my order', 'order status', 'order number', 'track order', 'order update']
};

// Use intent-based grouping
const intentKeywords = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
  urgency: ['urgent', 'asap', 'emergency', 'immediately', 'now'],
  satisfaction: ['thank you', 'thanks', 'perfect', 'great', 'awesome'],
  dissatisfaction: ['disappointed', 'angry', 'frustrated', 'terrible', 'awful']
};
```

### Response Optimization

```typescript
// Optimize response timing
const responseOptimization = {
  // Add slight delay to seem more human
  humanDelay: Math.random() * 2000 + 1000, // 1-3 seconds
  
  // Vary responses to avoid seeming robotic
  greetingVariations: [
    'Hi there! 👋 How can I help you today?',
    'Hello! Thanks for reaching out. What can I do for you?',
    'Hey! 😊 Great to hear from you. How can I assist?'
  ],
  
  // Use random variation
  getRandomResponse: (variations: string[]) => {
    return variations[Math.floor(Math.random() * variations.length)];
  }
};
```

## Escalation Rules

### When to Escalate to Human

```typescript
const escalationTriggers = {
  // Emotional keywords
  emotions: ['angry', 'frustrated', 'disappointed', 'upset', 'furious'],
  
  // Complex requests
  complex: ['refund', 'return', 'exchange', 'complaint', 'legal'],
  
  // Failed auto-reply
  autoReplyFailed: ['didn\'t understand', 'not helpful', 'talk to person'],
  
  // Multiple messages without resolution
  messageThreshold: 5, // If user sends 5+ messages without resolution
  
  // VIP customers (verified users, high followers)
  vipEscalation: (user: InstagramUser) => {
    return user.is_verified_user || (user.follower_count || 0) > 10000;
  }
};

const escalationAutoReply = {
  trigger_keywords: escalationTriggers.complex,
  response_type: 'quick_reply',
  response_content: {
    text: 'I understand this requires special attention. Let me connect you with our specialist team:',
    replies: [
      { content_type: 'text', title: 'Priority Support', payload: 'ESCALATE_PRIORITY' },
      { content_type: 'text', title: 'Schedule Call', payload: 'ESCALATE_CALL' },
      { content_type: 'text', title: 'Email Specialist', payload: 'ESCALATE_EMAIL' }
    ]
  },
  priority: 9,
  escalate: true // Flag for human review
};
```

## Performance Optimization

### Rule Efficiency

```typescript
// Order rules by frequency and priority
const ruleOptimization = {
  // Most common triggers first
  ruleOrder: [
    'greeting', // 40% of messages
    'support',  // 25% of messages  
    'product',  // 20% of messages
    'order',    // 10% of messages
    'other'     // 5% of messages
  ],
  
  // Cache compiled regex patterns
  compiledPatterns: new Map(),
  
  // Fast keyword matching
  fastMatch: (message: string, keywords: string[]): boolean => {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }
};
```

### Memory Management

```typescript
// Limit auto-reply history to prevent memory issues
const autoReplyHistory = {
  maxHistoryPerUser: 50,
  maxTotalHistory: 10000,
  
  cleanup: () => {
    // Remove old auto-reply records
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    cleanupAutoReplyHistory(cutoff);
  }
};
```

## Debugging Auto-Replies

### Debug Mode

```typescript
// Enable detailed auto-reply debugging
localStorage.setItem('instagram_auto_reply_debug', 'true');

// Debug information logged:
// - Rule matching process
// - Keyword hit analysis
// - Response selection logic
// - Timing and delays
// - User preference checks
```

### Rule Testing Tools

```typescript
const debugAutoReply = (message: string, userId: string) => {
  console.log('🔍 Auto-Reply Debug:', {
    message,
    userId,
    businessHoursActive: isBusinessHoursActive(),
    userCanReceiveAutoReply: canReceiveAutoReply(userId),
    matchingRules: findMatchingRules(message),
    selectedRule: selectHighestPriorityRule(message),
    responseWillBeSent: willSendAutoReply(message, userId)
  });
};
```

## Auto-Reply Templates

### E-commerce Store

```typescript
const ecommerceAutoReplies = [
  {
    trigger: ['price', 'cost', 'how much'],
    response: 'I\'d be happy to help with pricing! Are you looking for:\n\n• Specific product info\n• Current sale prices\n• Bulk discounts\n• Payment options?'
  },
  {
    trigger: ['shipping', 'delivery', 'when will'],
    response: '📦 Shipping Info:\n\n• Free shipping on orders $50+\n• 2-3 business days standard\n• Next-day available\n\nNeed tracking info for existing order?'
  },
  {
    trigger: ['return', 'exchange', 'refund'],
    response: '↩️ Returns are easy!\n\n• 30-day return window\n• Free return shipping\n• Full refund or exchange\n\nNeed to start a return?'
  }
];
```

### Service Business

```typescript
const serviceAutoReplies = [
  {
    trigger: ['appointment', 'booking', 'schedule'],
    response: '📅 Ready to book an appointment?\n\nI can help you:\n• Check availability\n• Schedule online\n• Reschedule existing appointment\n• Answer service questions'
  },
  {
    trigger: ['price', 'cost', 'quote'],
    response: '💰 Service Pricing:\n\nPricing depends on your specific needs. I can provide:\n• Instant quote for standard services\n• Custom estimate for complex projects\n• Package deals\n\nWhat service are you interested in?'
  }
];
```

## Auto-Reply Metrics & KPIs

### Key Metrics to Track

```typescript
const autoReplyKPIs = {
  // Effectiveness
  response_rate: 0.75, // 75% of auto-replies get user response
  escalation_rate: 0.20, // 20% need human intervention
  resolution_rate: 0.60, // 60% resolved by auto-reply alone
  
  // User satisfaction  
  satisfaction_score: 4.1, // Out of 5
  complaint_rate: 0.05, // 5% complain about auto-replies
  
  // Business impact
  time_saved_hours: 120, // Per month
  cost_per_interaction: 0.02, // $0.02 per auto-reply vs $2.50 human
  
  // Performance
  avg_response_time_ms: 250,
  rule_processing_time_ms: 15
};
```

This covers all the specific documentation needed for the Instagram DMs feature with Facebook Login approach. Would you like me to create any of these guides, or do you need clarification on any particular aspect?