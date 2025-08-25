# 📊 **AI Training from Your Chat History**

## 🎯 **Overview**

This guide shows you how to train your AI by analyzing your actual customer conversations. The AI will learn from your real responses and replicate your customer service style.

## 📋 **How It Works**

1. **Export your chat conversations** from WhatsApp/GreenAPI
2. **Format them** into the required structure
3. **Analyze patterns** in your responses
4. **Generate AI training data** based on your style
5. **Update your AI** with the learned patterns

## 🚀 **Step-by-Step Training Process**

### **Step 1: Export Your Chat Data**

**From WhatsApp:**
- Go to WhatsApp Web or Desktop
- Export chat history (if available)
- Or manually copy your conversations

**From GreenAPI:**
- Check your webhook logs for conversation history
- Export from your database if stored

### **Step 2: Format Your Chat Data**

Create a JSON file with this structure:

```json
[
  {
    "customer": "Customer's message",
    "your_response": "Your actual response",
    "category": "category_name"
  }
]
```

**Example:**
```json
[
  {
    "customer": "Hi, do you repair phones?",
    "your_response": "Yes! Tuna huduma za kurekebisha simu, laptop, na vifaa vingine. Una tatizo gani?",
    "category": "service_inquiry"
  },
  {
    "customer": "What's the price for screen replacement?",
    "your_response": "Bei ya kubadili screen: iPhone 50,000-150,000, Samsung 30,000-100,000.",
    "category": "pricing"
  }
]
```

### **Step 3: Use the Chat Analyzer**

```bash
# Analyze your chat data
node scripts/chat-analyzer.js import your-chats.json

# Or use sample data to see how it works
node scripts/chat-analyzer.js analyze
```

### **Step 4: Review Generated AI Code**

The analyzer will create `generated-ai-code.js` with AI patterns based on your conversations.

### **Step 5: Update Your Webhook**

Replace the AI function in `netlify/functions/ai-whatsapp-webhook.js` with the generated code.

## 📝 **Categories for Your Chat Data**

Use these categories to organize your conversations:

- **service_inquiry** - Questions about your services
- **pricing** - Price inquiries and costs
- **technical_support** - Technical problems and repairs
- **location** - Where you're located
- **schedule** - Business hours and availability
- **urgent** - Emergency or urgent requests
- **warranty** - Warranty questions
- **appointment** - Booking and scheduling
- **appreciation** - Thank you messages
- **complaint** - Customer complaints
- **goodbye** - Farewell messages

## 🧪 **Testing Your Trained AI**

### **Test Individual Messages:**
```bash
node scripts/ai-training-manager.js analyze "My phone is not charging"
```

### **Test Webhook Directly:**
```bash
curl -X POST https://a02559b7d2b7.ngrok-free.app/.netlify/functions/ai-whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "What is the price for screen replacement?"}'
```

### **Test Real WhatsApp:**
```bash
node scripts/test-real-webhook.js
```

## 📊 **What the AI Learns**

### **Pattern Recognition:**
- **Keywords** from customer messages
- **Phrases** commonly used
- **Response patterns** you use
- **Language style** (Swahili/English mix)
- **Tone** (professional, friendly, urgent)

### **Response Generation:**
- **Exact responses** you've used
- **Response variations** for similar questions
- **Context awareness** based on keywords
- **Confidence scoring** for matches

## 🔧 **Advanced Training Features**

### **1. Multiple Response Variations**

For the same question, provide multiple responses:

```json
[
  {
    "customer": "What's the price?",
    "your_response": "Bei zetu hutofautiana kulingana na tatizo. Kwa huduma za technician: Tsh 10,000-50,000.",
    "category": "pricing"
  },
  {
    "customer": "How much does it cost?",
    "your_response": "Bei zetu ni nafuu na za kusikika! Kwa huduma za technician: Tsh 10,000-50,000.",
    "category": "pricing"
  }
]
```

### **2. Context-Specific Responses**

```json
[
  {
    "customer": "iPhone screen price",
    "your_response": "Bei ya kubadili screen ya iPhone: 50,000-150,000 kulingana na model.",
    "category": "pricing"
  },
  {
    "customer": "Samsung battery price",
    "your_response": "Bei ya kubadili battery ya Samsung: 20,000-40,000 kulingana na model.",
    "category": "pricing"
  }
]
```

### **3. Language Variations**

```json
[
  {
    "customer": "Hi",
    "your_response": "Mambo! Karibu kwenye LATS CHANCE. Una tatizo gani?",
    "category": "greeting"
  },
  {
    "customer": "Jambo",
    "your_response": "Jambo! Karibu kwenye huduma zetu. Tunaweza kukusaidia na tatizo lolote.",
    "category": "greeting"
  }
]
```

## 📈 **Training Best Practices**

### **1. Quality Over Quantity**
- Use **real conversations** you've had
- Include **successful interactions**
- Avoid **generic responses**
- Focus on **your unique style**

### **2. Categorize Properly**
- Use **specific categories** for better matching
- Group **similar questions** together
- Include **variations** of the same question
- Add **context** when needed

### **3. Regular Updates**
- **Analyze new conversations** weekly
- **Update patterns** based on customer feedback
- **Add new categories** as needed
- **Refine responses** based on success

### **4. Monitor Performance**
- **Track response accuracy**
- **Monitor customer satisfaction**
- **Identify missed patterns**
- **Update training data** accordingly

## 🎯 **Example Training Scenarios**

### **Scenario 1: Price Inquiries**

**Your Chat Data:**
```json
[
  {
    "customer": "What's the price for screen replacement?",
    "your_response": "Bei ya kubadili screen hutofautiana: iPhone 50,000-150,000, Samsung 30,000-100,000.",
    "category": "pricing"
  },
  {
    "customer": "How much for battery replacement?",
    "your_response": "Bei ya kubadili battery: 15,000-50,000 kulingana na aina ya simu.",
    "category": "pricing"
  },
  {
    "customer": "Charger price?",
    "your_response": "Bei ya charger: 5,000-15,000 kulingana na aina ya simu.",
    "category": "pricing"
  }
]
```

**AI Will Learn:**
- Keywords: "price", "screen", "battery", "charger", "replacement"
- Patterns: "What's the price for...", "How much for...", "...price?"
- Responses: Your specific pricing responses

### **Scenario 2: Technical Support**

**Your Chat Data:**
```json
[
  {
    "customer": "My phone is not charging",
    "your_response": "Tunaona tatizo lako! Hiyo inaweza kuwa battery au charging port. Mtaalamu wetu atakusaidia haraka.",
    "category": "technical_support"
  },
  {
    "customer": "Screen is broken",
    "your_response": "Tunaweza kubadili screen yako. Bei hutofautiana kulingana na aina ya simu. Unaweza kuja leo?",
    "category": "technical_support"
  }
]
```

**AI Will Learn:**
- Keywords: "not charging", "broken", "screen", "phone"
- Patterns: "My phone is...", "...is broken"
- Responses: Your technical support style

## 🔄 **Continuous Improvement**

### **Weekly Tasks:**
1. **Export new conversations** from the past week
2. **Analyze patterns** in new interactions
3. **Update training data** with new examples
4. **Test AI responses** with new scenarios

### **Monthly Tasks:**
1. **Review AI performance** metrics
2. **Identify missed patterns** or responses
3. **Update categories** if needed
4. **Optimize response quality**

### **Quarterly Tasks:**
1. **Major training data review**
2. **Performance optimization**
3. **New feature integration**
4. **Customer feedback analysis**

## 📞 **Support and Troubleshooting**

### **Common Issues:**

**1. AI not matching patterns:**
- Check if keywords are in your training data
- Add more variations of the same question
- Review category assignments

**2. Generic responses:**
- Use more specific responses in training data
- Add context-specific examples
- Include your unique language style

**3. Low confidence scores:**
- Add more examples for that category
- Include more keyword variations
- Review pattern matching logic

### **Getting Help:**
- Check the generated AI code for errors
- Review the chat analyzer output
- Test with sample data first
- Monitor webhook logs for issues

## 🎉 **Success Metrics**

Track these to measure training success:
- **Pattern Match Rate**: How often AI finds relevant patterns
- **Response Accuracy**: How well responses match your style
- **Customer Satisfaction**: Feedback on AI responses
- **Human Escalation Rate**: How often human intervention is needed

---

## 🚀 **Quick Start Commands**

```bash
# 1. Create your chat data file
cp templates/chat-data-template.json my-chats.json

# 2. Edit my-chats.json with your actual conversations

# 3. Analyze your chat data
node scripts/chat-analyzer.js import my-chats.json

# 4. Test the generated AI
node scripts/ai-training-manager.js analyze "My phone is broken"

# 5. Update your webhook with generated code
# Copy content from generated-ai-code.js to ai-whatsapp-webhook.js
```

Your AI will now respond exactly like you do! 🎯
