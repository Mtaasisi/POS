# Instagram Message Templates Guide

## Overview

This guide covers all message template types available in the Instagram Messaging API with Facebook Login approach. Each template type has specific formatting requirements and use cases.

## Template Types

### 1. Text Messages

Simple text messages with optional quick replies.

**Limits:**
- Maximum 1000 characters
- Unicode and emojis supported
- Line breaks preserved

**Example:**
```typescript
await instagramActions.sendMessage(
  recipientId, 
  "Hello! Thanks for reaching out. How can I help you today? 😊"
);
```

### 2. Quick Replies

Text message with up to 13 quick reply buttons.

**Limits:**
- Maximum 13 quick reply buttons
- Button title: 20 characters max
- Payload: 1000 characters max
- Main text: 2000 characters max

**Example:**
```typescript
const quickReplies = [
  { content_type: 'text', title: 'View Products', payload: 'PRODUCTS' },
  { content_type: 'text', title: 'Order Status', payload: 'ORDER_STATUS' },
  { content_type: 'text', title: 'Support', payload: 'SUPPORT' },
  { content_type: 'text', title: 'Hours', payload: 'BUSINESS_HOURS' }
];

await instagramActions.sendQuickReplies(
  recipientId,
  "How can I help you today? Choose an option below:",
  quickReplies
);
```

### 3. Generic Template (Carousel)

Rich carousel with multiple cards, each containing image, text, and buttons.

**Limits:**
- Maximum 10 elements (cards) per template
- Element title: 80 characters max
- Element subtitle: 80 characters max
- Maximum 3 buttons per element
- Button title: 20 characters max
- Image aspect ratio: 1.91:1 recommended

**Example:**
```typescript
const productTemplate = {
  template_type: 'generic',
  elements: [
    {
      title: 'Premium Wireless Headphones',
      subtitle: 'High-quality sound with noise cancellation - $199',
      image_url: 'https://yourstore.com/images/headphones.jpg',
      buttons: [
        {
          type: 'web_url',
          title: 'View Details',
          url: 'https://yourstore.com/products/headphones'
        },
        {
          type: 'postback',
          title: 'Add to Cart',
          payload: 'ADD_TO_CART_headphones_001'
        },
        {
          type: 'postback',
          title: 'More Info',
          payload: 'INFO_headphones_001'
        }
      ]
    },
    {
      title: 'Smart Fitness Watch',
      subtitle: 'Track your health and fitness goals - $299',
      image_url: 'https://yourstore.com/images/watch.jpg',
      buttons: [
        {
          type: 'web_url',
          title: 'View Details',
          url: 'https://yourstore.com/products/watch'
        },
        {
          type: 'postback',
          title: 'Add to Cart',
          payload: 'ADD_TO_CART_watch_001'
        }
      ]
    }
  ]
};

await instagramActions.sendTemplate(recipientId, productTemplate);
```

### 4. Button Template

Single message with up to 3 action buttons.

**Limits:**
- Text: 640 characters max
- Maximum 3 buttons
- Button title: 20 characters max

**Example:**
```typescript
const supportTemplate = {
  template_type: 'button',
  text: 'We received your support request. Our team will review it and get back to you within 24 hours. In the meantime, you can:',
  buttons: [
    {
      type: 'web_url',
      title: 'Check FAQ',
      url: 'https://yourstore.com/faq'
    },
    {
      type: 'postback',
      title: 'Urgent Issue',
      payload: 'URGENT_SUPPORT'
    },
    {
      type: 'web_url',
      title: 'Live Chat',
      url: 'https://yourstore.com/chat'
    }
  ]
};

await instagramActions.sendTemplate(recipientId, supportTemplate);
```

## Template Best Practices

### Image Guidelines

**Recommended Specifications:**
- **Size**: 1200x630px (1.91:1 aspect ratio)
- **Format**: JPG or PNG
- **File size**: Under 1MB
- **Quality**: High-resolution for mobile displays

**Image Tips:**
- Use bright, clear images
- Avoid text-heavy images (Instagram may not display well)
- Test images on mobile devices
- Use consistent branding across templates

### Text Content Guidelines

**Writing Effective Messages:**
- Keep text concise and scannable
- Use emojis to add personality (but don't overuse)
- Include clear call-to-action
- Write in conversational tone
- Consider mobile reading experience

**Character Optimization:**
```typescript
// Good: Concise and clear
"🎉 New arrivals! Premium headphones now available. View collection or get support."

// Bad: Too long and wordy  
"Hello valued customer! We are excited to announce that we have received new inventory including premium wireless headphones with advanced noise cancellation technology that we think you will absolutely love based on your previous purchase history..."
```

### Button Design

**Button Text Best Practices:**
- Use action words (View, Buy, Learn, Get)
- Keep under 15 characters when possible
- Be specific about the action
- Use consistent terminology

**Good Button Examples:**
```typescript
// E-commerce
{ title: 'View Product', payload: 'PRODUCT_123' }
{ title: 'Add to Cart', payload: 'CART_ADD_123' }
{ title: 'Check Price', payload: 'PRICE_123' }

// Support
{ title: 'Get Help', payload: 'SUPPORT_START' }
{ title: 'Track Order', payload: 'ORDER_TRACK' }
{ title: 'Contact Us', payload: 'CONTACT_FORM' }

// Information
{ title: 'Learn More', payload: 'INFO_PRODUCT' }
{ title: 'View Hours', payload: 'BUSINESS_HOURS' }
{ title: 'Find Store', payload: 'STORE_LOCATOR' }
```

## Template Categories

### E-commerce Templates

**Product Showcase:**
```typescript
{
  template_type: 'generic',
  elements: [
    {
      title: 'Featured Product Name',
      subtitle: 'Brief description • $XX.XX',
      image_url: 'product_image_url',
      buttons: [
        { type: 'web_url', title: 'View Product', url: 'product_url' },
        { type: 'postback', title: 'Add to Cart', payload: 'CART_ADD_id' }
      ]
    }
  ]
}
```

**Order Status:**
```typescript
{
  template_type: 'button',
  text: 'Your order #12345 has shipped! 📦 Expected delivery: Jan 15, 2024',
  buttons: [
    { type: 'web_url', title: 'Track Package', url: 'tracking_url' },
    { type: 'postback', title: 'Order Details', payload: 'ORDER_12345' },
    { type: 'postback', title: 'Contact Support', payload: 'SUPPORT_ORDER' }
  ]
}
```

### Customer Service Templates

**FAQ Quick Replies:**
```typescript
const faqReplies = [
  { content_type: 'text', title: 'Shipping Info', payload: 'FAQ_SHIPPING' },
  { content_type: 'text', title: 'Return Policy', payload: 'FAQ_RETURNS' },
  { content_type: 'text', title: 'Size Guide', payload: 'FAQ_SIZING' },
  { content_type: 'text', title: 'Payment Help', payload: 'FAQ_PAYMENT' }
];
```

**Support Options:**
```typescript
{
  template_type: 'button',
  text: 'How can our support team help you today?',
  buttons: [
    { type: 'postback', title: 'Technical Issue', payload: 'SUPPORT_TECH' },
    { type: 'postback', title: 'Order Problem', payload: 'SUPPORT_ORDER' },
    { type: 'web_url', title: 'Live Chat', url: 'https://yourstore.com/chat' }
  ]
}
```

### Business Information Templates

**Business Hours:**
```typescript
{
  template_type: 'button',
  text: '🕒 Our Business Hours:\n\nMon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM\nSun: Closed\n\nTimezone: EST',
  buttons: [
    { type: 'postback', title: 'Contact Now', payload: 'CONTACT_IMMEDIATE' },
    { type: 'web_url', title: 'Schedule Call', url: 'https://calendly.com/yourstore' },
    { type: 'postback', title: 'Email Us', payload: 'CONTACT_EMAIL' }
  ]
}
```

## Error Handling

### Invalid Template Response

```typescript
// Handle template validation errors
try {
  await instagramActions.sendTemplate(recipientId, template);
} catch (error) {
  if (error.code === 100) {
    // Invalid template format
    console.error('Template validation failed:', error.message);
  } else if (error.code === 613) {
    // Rate limit exceeded
    console.error('Rate limit hit, retry later');
  }
}
```

### Image Loading Failures

```typescript
// Handle broken image URLs in templates
const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
};

// Use before sending template
if (!(await validateImageUrl(template.elements[0].image_url))) {
  // Use fallback image or remove image_url
  delete template.elements[0].image_url;
}
```

## Template Storage & Management

### Saving Templates

```typescript
// Save template for reuse
const template = {
  id: 'welcome_flow_001',
  name: 'Welcome Flow',
  type: 'quick_reply',
  category: 'onboarding',
  content: {
    text: 'Welcome! How can I help you today?',
    replies: [
      { content_type: 'text', title: 'View Products', payload: 'PRODUCTS' },
      { content_type: 'text', title: 'Track Order', payload: 'ORDER_STATUS' },
      { content_type: 'text', title: 'Get Support', payload: 'SUPPORT' }
    ]
  },
  usage_count: 0,
  is_active: true
};

instagramActions.addMessageTemplate(template);
```

### Template Performance Tracking

```typescript
// Track which templates work best
const templateAnalytics = {
  template_id: 'welcome_flow_001',
  sent_count: 150,
  response_rate: 0.78, // 78% of users responded
  click_through_rate: 0.65, // 65% clicked buttons
  conversion_rate: 0.23, // 23% completed desired action
  avg_response_time: 12 // minutes to user response
};
```

## Advanced Template Features

### Dynamic Content

```typescript
// Generate personalized templates
const createPersonalizedTemplate = (user: InstagramUser, products: Product[]) => {
  const username = user.name || user.username;
  const isVerified = user.is_verified_user;
  
  return {
    template_type: 'generic',
    elements: products.map(product => ({
      title: `${isVerified ? '⭐ ' : ''}${product.name}`,
      subtitle: `Hey ${username}! Special price: $${product.price}`,
      image_url: product.images[0],
      buttons: [
        { type: 'web_url', title: 'Buy Now', url: product.url },
        { type: 'postback', title: 'Save', payload: `SAVE_${product.id}` }
      ]
    }))
  };
};
```

### Template Versioning

```typescript
// Version control for templates
const templateVersion = {
  template_id: 'welcome_flow',
  version: '2.1',
  changes: 'Added emoji, improved button text',
  created_at: '2024-01-15T10:30:00Z',
  performance_improvement: '+15% response rate',
  rollback_version: '2.0'
};
```

## Testing Templates

### Template Validation

```typescript
// Validate template before sending
const validateTemplate = (template: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (template.template_type === 'generic') {
    if (!template.elements || template.elements.length === 0) {
      errors.push('Generic template must have at least one element');
    }
    
    if (template.elements.length > 10) {
      errors.push('Generic template cannot have more than 10 elements');
    }
    
    template.elements.forEach((element: any, index: number) => {
      if (!element.title) {
        errors.push(`Element ${index + 1} must have a title`);
      }
      
      if (element.title && element.title.length > 80) {
        errors.push(`Element ${index + 1} title too long (max 80 chars)`);
      }
      
      if (element.buttons && element.buttons.length > 3) {
        errors.push(`Element ${index + 1} cannot have more than 3 buttons`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
};
```

### A/B Testing Templates

```typescript
// A/B test different template versions
const templateVariants = {
  control: {
    text: 'How can I help you today?',
    buttons: [
      { type: 'postback', title: 'Products', payload: 'PRODUCTS' },
      { type: 'postback', title: 'Support', payload: 'SUPPORT' }
    ]
  },
  variant: {
    text: '👋 Hey! What brings you here today?',
    buttons: [
      { type: 'postback', title: '🛍️ Shop Now', payload: 'PRODUCTS' },
      { type: 'postback', title: '💬 Get Help', payload: 'SUPPORT' }
    ]
  }
};

// Use random variant
const template = Math.random() > 0.5 ? templateVariants.control : templateVariants.variant;
```

## Common Template Patterns

### Welcome Flow
```typescript
const welcomeFlow = {
  initial: {
    text: 'Welcome to [Your Store]! 👋\n\nI\'m here to help with:\n• Product questions\n• Order support\n• Store information',
    quick_replies: [
      { content_type: 'text', title: 'Browse Products', payload: 'BROWSE' },
      { content_type: 'text', title: 'Track Order', payload: 'TRACK' },
      { content_type: 'text', title: 'Get Help', payload: 'HELP' }
    ]
  }
};
```

### Product Recommendation
```typescript
const recommendationTemplate = {
  template_type: 'generic',
  elements: [
    {
      title: 'Based on your interests...',
      subtitle: 'Here are some products you might like',
      image_url: 'https://yourstore.com/images/recommendations.jpg',
      buttons: [
        { type: 'postback', title: 'See All', payload: 'RECOMMENDATIONS_ALL' },
        { type: 'web_url', title: 'Visit Store', url: 'https://yourstore.com' }
      ]
    }
  ]
};
```

### Abandoned Cart Recovery
```typescript
const cartRecoveryTemplate = {
  template_type: 'button',
  text: '🛒 You left something in your cart!\n\nComplete your purchase and get 10% off with code SAVE10',
  buttons: [
    { type: 'web_url', title: 'Complete Order', url: 'https://yourstore.com/cart' },
    { type: 'postback', title: 'Remove Items', payload: 'CART_CLEAR' },
    { type: 'postback', title: 'Save for Later', payload: 'CART_SAVE' }
  ]
};
```

## Template Performance Optimization

### Loading Speed
- Optimize image sizes (use compressed images)
- Use CDN for image hosting
- Preload critical templates
- Cache frequently used templates

### User Engagement
- Use action-oriented button text
- Include relevant emojis (but don't overuse)
- Personalize with user's name when available
- Test different message lengths

### Conversion Optimization
- Clear value propositions
- Urgent/limited time messaging
- Social proof (reviews, ratings)
- Easy next steps

## Template Debugging

### Common Issues

1. **Template Not Displaying:**
   ```typescript
   // Check image URL accessibility
   // Verify template structure
   // Check character limits
   ```

2. **Buttons Not Working:**
   ```typescript
   // Verify payload format
   // Check button titles length
   // Ensure postback handling is set up
   ```

3. **Images Not Loading:**
   ```typescript
   // Use HTTPS URLs only
   // Check image dimensions
   // Verify image is publicly accessible
   // Test image loading in browser
   ```

### Debug Mode

Enable template debugging:
```typescript
// Add to localStorage for debugging
localStorage.setItem('instagram_template_debug', 'true');

// This will log:
// - Template validation results
// - API request/response details
// - Image loading status
// - Button click events
```

## Template Migration

### Upgrading Templates

When updating template formats:
```typescript
// Version 1.0 → 2.0 migration
const migrateTemplate = (oldTemplate: any) => {
  return {
    ...oldTemplate,
    version: '2.0',
    migrated_at: new Date().toISOString(),
    // Add new fields
    category: 'general',
    tags: ['customer-service'],
    // Update structure if needed
    content: updateTemplateStructure(oldTemplate.content)
  };
};
```

## Template Library Examples

Pre-built templates for common use cases:

### Retail Store
- Product catalog showcase
- Sale announcements
- Size guides
- Store hours and location

### Restaurant
- Menu highlights
- Daily specials
- Reservation booking
- Delivery options

### Service Business
- Service offerings
- Appointment booking
- FAQ responses
- Contact information

### E-learning
- Course catalog
- Progress tracking
- Assignment reminders
- Study resources

Would you like me to create specific templates for your business type or expand on any particular template category?
