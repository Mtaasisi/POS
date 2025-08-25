# 🤖 AI Training Guide for WhatsApp Customer Service

## Overview

Your WhatsApp AI system is now fully operational with **enhanced training capabilities**! This guide will help you understand how to train and customize your AI for better customer interactions.

## 🎯 Current AI Capabilities

### **Database Auto-Reply Rules (Priority)**
- ✅ "xxx" → "fuck u"
- ✅ "Hi" → "Mambo vipi weweeeeee"
- ✅ "Hello" → "Hello! How can I help you today?"

### **AI Analysis Categories (Smart Fallback)**
1. **Greetings** - Hi, Hello, Mambo, Jambo, etc.
2. **Pricing** - Price inquiries, costs, budgets
3. **Technical Support** - Repairs, broken devices, technical issues
4. **Service Inquiries** - What services you offer
5. **Location** - Where your shop is located
6. **Schedule** - When you're open, availability
7. **Urgent** - Emergency requests, urgent matters
8. **Appointments** - Booking, scheduling, visits
9. **Complaints** - Customer complaints, issues
10. **Appreciation** - Thank you messages
11. **Goodbye** - Farewell messages

## 🧪 Testing Your AI

### **Test Individual Messages**
```bash
node scripts/ai-training-manager.js analyze "My phone is broken"
```

### **Test All Categories**
```bash
node scripts/ai-training-manager.js test
```

### **Show Current Training Data**
```bash
node scripts/ai-training-manager.js show
```

## 🎓 How to Train Your AI

### **1. Add New Database Auto-Reply Rules**

Use the existing database system to add exact match rules:

```sql
INSERT INTO whatsapp_auto_reply_rules (trigger, response, enabled, exact_match, case_sensitive)
VALUES ('your_trigger', 'your_response', true, true, false);
```

### **2. Add New AI Patterns**

Edit the `netlify/functions/ai-whatsapp-webhook.js` file and add new patterns to the `analyzeMessageWithAI` function:

```javascript
// Example: Add new category
else if (lowerMessage.includes('warranty') || lowerMessage.includes('dhamana') ||
         lowerMessage.includes('guarantee') || lowerMessage.includes('uhakika')) {
  analysis.shouldReply = true;
  analysis.confidence = 0.8;
  analysis.action = 'auto_reply';
  analysis.category = 'warranty';
  analysis.replyMessage = 'Tuna dhamana ya siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena ndani ya siku 30, tutarekebisha bila malipo.';
}
```

### **3. Add Multiple Response Variations**

For better natural conversations, add multiple response variations:

```javascript
// Instead of one response, use an array
const warrantyResponses = [
  'Tuna dhamana ya siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena ndani ya siku 30, tutarekebisha bila malipo.',
  'Tuna uhakika wa siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena, tutarekebisha bila malipo.',
  'Tuna dhamana ya siku 30. Ikiwa kuna tatizo tena, tutarekebisha bila malipo.'
];

// Select random response
const randomIndex = Math.floor(Math.random() * warrantyResponses.length);
analysis.replyMessage = warrantyResponses[randomIndex];
```

## 📝 Common Training Scenarios

### **Scenario 1: Device-Specific Responses**
```javascript
// Add device-specific patterns
else if (lowerMessage.includes('iphone') || lowerMessage.includes('samsung') ||
         lowerMessage.includes('huawei') || lowerMessage.includes('xiaomi')) {
  analysis.shouldReply = true;
  analysis.confidence = 0.8;
  analysis.action = 'auto_reply';
  analysis.category = 'device_specific';
  analysis.replyMessage = 'Tuna huduma za kurekebisha simu zote: iPhone, Samsung, Huawei, Xiaomi na nyingine. Mtaalamu wetu atakusaidia haraka.';
}
```

### **Scenario 2: Price Ranges**
```javascript
// Add specific price inquiries
else if (lowerMessage.includes('screen replacement') || lowerMessage.includes('badili screen')) {
  analysis.shouldReply = true;
  analysis.confidence = 0.9;
  analysis.action = 'auto_reply';
  analysis.category = 'screen_repair';
  analysis.replyMessage = 'Bei ya kubadili screen hutofautiana: iPhone 50,000-150,000, Samsung 30,000-100,000, Huawei 25,000-80,000. Tafadhali tuambie aina ya simu yako.';
}
```

### **Scenario 3: Business Hours**
```javascript
// Add specific time inquiries
else if (lowerMessage.includes('saturday') || lowerMessage.includes('jumamosi') ||
         lowerMessage.includes('sunday') || lowerMessage.includes('jumapili')) {
  analysis.shouldReply = true;
  analysis.confidence = 0.8;
  analysis.action = 'auto_reply';
  analysis.category = 'weekend_hours';
  analysis.replyMessage = 'Tuna kazi Jumamosi na Jumapili pia! Masaa: 8:00 AM - 8:00 PM. Unaweza kuja weekend au tutumie technician kwenu.';
}
```

## 🔧 Advanced Training Features

### **1. Context Awareness**
Train your AI to understand context:

```javascript
// Check for multiple keywords for better accuracy
if (lowerMessage.includes('broken') && lowerMessage.includes('screen')) {
  analysis.category = 'screen_repair';
  analysis.replyMessage = 'Tuna huduma za kubadili screen. Bei hutofautiana kulingana na aina ya simu. Tafadhali tuambie aina ya simu yako.';
} else if (lowerMessage.includes('broken') && lowerMessage.includes('battery')) {
  analysis.category = 'battery_repair';
  analysis.replyMessage = 'Tuna huduma za kubadili battery. Bei: 15,000-50,000 kulingana na aina ya simu.';
}
```

### **2. Language Detection**
Train for multiple languages:

```javascript
// Swahili patterns
if (lowerMessage.includes('shikamoo') || lowerMessage.includes('marahaba')) {
  analysis.replyMessage = 'Shikamoo! Karibu kwenye LATS CHANCE. Tuna huduma za kurekebisha vifaa na kuuza.';
}

// English patterns
if (lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon')) {
  analysis.replyMessage = 'Good morning! Welcome to LATS CHANCE. We offer device repair and sales services.';
}
```

### **3. Urgency Detection**
Train for urgent requests:

```javascript
// Check for urgency indicators
const urgencyWords = ['urgent', 'emergency', 'now', 'immediately', 'asap', 'haraka', 'dharura'];
const hasUrgency = urgencyWords.some(word => lowerMessage.includes(word));

if (hasUrgency) {
  analysis.category = 'urgent';
  analysis.confidence = 0.9;
  analysis.replyMessage = 'Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Unaweza kuja ofisini sasa au tutumie technician kwenu mara moja.';
}
```

## 📊 Monitoring and Analytics

### **Track AI Performance**
Monitor which responses work best:

1. **Check webhook logs** for response patterns
2. **Analyze customer satisfaction** based on follow-up messages
3. **Track response times** and success rates
4. **Monitor category distribution** to see what customers ask most

### **Response Quality Metrics**
- **Confidence Score**: How sure the AI is about the response
- **Category Accuracy**: Whether the right category was selected
- **Customer Engagement**: Whether customers respond positively
- **Resolution Rate**: Whether the AI response solved the customer's issue

## 🚀 Best Practices

### **1. Keep Responses Natural**
- Use conversational language
- Include relevant details
- Ask follow-up questions when needed
- Be helpful and professional

### **2. Test Regularly**
- Test new patterns before deploying
- Monitor real customer interactions
- Update responses based on feedback
- Keep training data current

### **3. Balance Automation and Human Touch**
- Use AI for common questions
- Escalate complex issues to humans
- Provide clear next steps
- Always offer human assistance when needed

### **4. Localize Content**
- Use appropriate language (Swahili/English)
- Include local context (Dar es Salaam)
- Use local currency (Tsh)
- Reference local landmarks

## 🔄 Continuous Improvement

### **Weekly Tasks**
1. Review customer interactions
2. Identify common questions not covered
3. Update response patterns
4. Test new scenarios

### **Monthly Tasks**
1. Analyze AI performance metrics
2. Update training data
3. Add new categories if needed
4. Optimize response quality

### **Quarterly Tasks**
1. Major training data review
2. Performance optimization
3. New feature integration
4. Customer feedback analysis

## 📞 Support and Maintenance

### **When to Update AI**
- New services or products
- Price changes
- Business hours changes
- Common customer complaints
- New device types
- Seasonal promotions

### **Emergency Updates**
For urgent changes, you can:
1. Update the webhook function directly
2. Add temporary database rules
3. Use the AI training manager for quick fixes

## 🎉 Success Metrics

Track these metrics to measure AI success:
- **Response Rate**: Percentage of messages that get AI responses
- **Accuracy Rate**: Percentage of correct category matches
- **Customer Satisfaction**: Positive feedback from customers
- **Resolution Rate**: Percentage of issues resolved by AI
- **Human Escalation Rate**: Percentage requiring human intervention

---

## 🚀 Quick Start Commands

```bash
# Test your AI
node scripts/ai-training-manager.js test

# Analyze specific message
node scripts/ai-training-manager.js analyze "My phone is broken"

# Show current training data
node scripts/ai-training-manager.js show

# Test webhook directly
curl -X POST http://localhost:8888/api/whatsapp-official-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "What are your prices?"}'
```

Your AI is now ready to provide excellent customer service! 🎯
