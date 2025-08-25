/**
 * Enhanced AI WhatsApp Chat Summary Generator
 * 
 * This script fetches all WhatsApp chats and uses external AI services for advanced analysis
 * Supports OpenAI GPT and Google Gemini for sophisticated chat analysis
 */

const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// AI Service Configuration
const AI_CONFIG = {
  // OpenAI Configuration (optional)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    enabled: false
  },
  // Google Gemini Configuration (optional)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-pro',
    enabled: false
  },
  // Use built-in analysis if no external AI is configured
  useBuiltIn: true
};

class EnhancedChatAnalyzer {
  constructor() {
    this.chatData = [];
  }

  async analyzeWithOpenAI(messages, chatInfo) {
    if (!AI_CONFIG.openai.enabled || !AI_CONFIG.openai.apiKey) {
      return null;
    }

    try {
      const messageTexts = messages.map(msg => this.extractMessageText(msg)).join('\n');
      const prompt = `Analyze this WhatsApp chat conversation and provide insights:

Chat: ${chatInfo?.name || 'Unknown'}
Messages: ${messageTexts}

Please provide:
1. Overall sentiment analysis
2. Key topics discussed
3. Communication patterns
4. Important insights or concerns
5. Recommendations

Format as JSON with keys: sentiment, topics, patterns, insights, recommendations`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: AI_CONFIG.openai.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
      }
    } catch (error) {
      console.log('OpenAI analysis failed:', error.message);
    }
    return null;
  }

  async analyzeWithGemini(messages, chatInfo) {
    if (!AI_CONFIG.gemini.enabled || !AI_CONFIG.gemini.apiKey) {
      return null;
    }

    try {
      const messageTexts = messages.map(msg => this.extractMessageText(msg)).join('\n');
      const prompt = `Analyze this WhatsApp chat and provide insights in JSON format:
Chat: ${chatInfo?.name || 'Unknown'}
Messages: ${messageTexts}

Return JSON with: sentiment, topics, patterns, insights, recommendations`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.gemini.model}:generateContent?key=${AI_CONFIG.gemini.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        return JSON.parse(content);
      }
    } catch (error) {
      console.log('Gemini analysis failed:', error.message);
    }
    return null;
  }

  extractMessageText(message) {
    if (message.textMessage) return message.textMessage;
    if (message.extendedTextMessage) return message.extendedTextMessage.text;
    if (message.imageMessage) return message.imageMessage.caption || 'Image message';
    if (message.videoMessage) return message.videoMessage.caption || 'Video message';
    if (message.audioMessage) return 'Voice message';
    if (message.documentMessage) return `Document: ${message.documentMessage.fileName || 'Unknown file'}`;
    if (message.locationMessage) return 'Location shared';
    if (message.contactMessage) return 'Contact shared';
    return 'Unknown message type';
  }

  async generateEnhancedSummary(chatId, messages, chatInfo) {
    // Try external AI services first
    let aiAnalysis = null;
    
    if (AI_CONFIG.openai.enabled) {
      aiAnalysis = await this.analyzeWithOpenAI(messages, chatInfo);
    } else if (AI_CONFIG.gemini.enabled) {
      aiAnalysis = await this.analyzeWithGemini(messages, chatInfo);
    }

    // Fallback to built-in analysis
    if (!aiAnalysis && AI_CONFIG.useBuiltIn) {
      aiAnalysis = this.builtInAnalysis(messages);
    }

    return {
      chatId,
      name: chatInfo?.name || 'Unknown',
      messageCount: messages.length,
      aiAnalysis,
      lastMessage: messages.length > 0 ? {
        text: this.extractMessageText(messages[messages.length - 1]),
        time: new Date(messages[messages.length - 1].timestamp * 1000).toLocaleString()
      } : null
    };
  }

  builtInAnalysis(messages) {
    // Simple built-in analysis as fallback
    const textMessages = messages.filter(msg => 
      msg.textMessage || msg.extendedTextMessage || msg.imageMessage?.caption || msg.videoMessage?.caption
    );

    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'thanks', 'thank you', 'perfect', 'love', 'like', 'awesome', 'fantastic', 'brilliant', 'super', 'nice', 'beautiful', 'best', 'outstanding', 'satisfied', 'pleased', 'delighted', 'grateful', 'appreciate', 'blessed', 'joy', 'excited', 'thrilled', 'ecstatic', 'elated', 'content', 'fulfilled'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointed', 'angry', 'frustrated', 'upset', 'sad', 'unhappy', 'worried', 'concerned', 'annoyed', 'irritated', 'mad', 'furious', 'hate', 'dislike', 'problem', 'issue', 'error', 'fail', 'broken', 'damaged', 'poor', 'worst', 'terrible', 'dreadful', 'miserable', 'depressed', 'anxious', 'stressed', 'overwhelmed', 'exhausted', 'tired', 'sick', 'pain', 'hurt', 'suffering'];

    let positiveCount = 0;
    let negativeCount = 0;
    const allText = textMessages.map(msg => this.extractMessageText(msg)).join(' ').toLowerCase();

    positiveWords.forEach(word => {
      if (allText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (allText.includes(word)) negativeCount++;
    });

    const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';

    return {
      sentiment,
      topics: ['Built-in analysis - limited topics'],
      patterns: ['Message frequency analysis'],
      insights: [`${messages.length} messages analyzed with ${sentiment} sentiment`],
      recommendations: ['Consider upgrading to external AI for detailed analysis']
    };
  }
}

async function runEnhancedAnalysis() {
  console.log('🤖 Enhanced AI WhatsApp Chat Analysis Starting...\n');
  console.log('🔧 AI Configuration:');
  console.log(`   OpenAI: ${AI_CONFIG.openai.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   Gemini: ${AI_CONFIG.gemini.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`   Built-in: ${AI_CONFIG.useBuiltIn ? 'Enabled' : 'Disabled'}\n`);

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  const analyzer = new EnhancedChatAnalyzer();
  
  try {
    // Get all chats
    console.log('📱 Fetching all WhatsApp chats...');
    const chatsResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChats/${apiToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!chatsResponse.ok) {
      throw new Error(`Failed to fetch chats: ${chatsResponse.status}`);
    }

    const chatsData = await chatsResponse.json();
    console.log(`✅ Found ${chatsData.length} chats\n`);

    // Analyze each chat
    const summaries = [];
    for (let i = 0; i < chatsData.length; i++) {
      const chat = chatsData[i];
      console.log(`📊 Analyzing chat ${i + 1}/${chatsData.length}: ${chat.name || chat.id}`);
      
      try {
        const historyResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChatHistory/${apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: chat.id, count: 50 })
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const summary = await analyzer.generateEnhancedSummary(chat.id, historyData, chat);
          summaries.push(summary);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Display results
    console.log('\n🎯 ENHANCED AI ANALYSIS RESULTS\n');
    console.log('=' .repeat(60));
    
    summaries.forEach((summary, index) => {
      console.log(`\n🔸 Chat ${index + 1}: ${summary.name}`);
      console.log(`   Messages: ${summary.messageCount}`);
      if (summary.aiAnalysis) {
        console.log(`   Sentiment: ${summary.aiAnalysis.sentiment}`);
        console.log(`   Topics: ${summary.aiAnalysis.topics?.join(', ') || 'None'}`);
        console.log(`   Insights: ${summary.aiAnalysis.insights?.join('; ') || 'None'}`);
        console.log(`   Recommendations: ${summary.aiAnalysis.recommendations?.join('; ') || 'None'}`);
      }
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    fs.writeFileSync(`enhanced-whatsapp-analysis-${timestamp}.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      summaries,
      aiConfig: AI_CONFIG
    }, null, 2));
    
    console.log(`\n💾 Enhanced analysis saved to: enhanced-whatsapp-analysis-${timestamp}.json`);

  } catch (error) {
    console.error('❌ Enhanced analysis failed:', error.message);
  }
}

// Run the enhanced analysis
runEnhancedAnalysis().then(() => {
  console.log('\n✅ Enhanced AI Analysis completed!');
}).catch(error => {
  console.error('❌ Analysis failed:', error);
});
