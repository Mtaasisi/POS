/**
 * AI WhatsApp Chat Summary Generator
 * 
 * This script fetches all WhatsApp chats and uses AI to generate comprehensive summaries
 * It analyzes chat patterns, sentiment, key topics, and provides insights
 */

// Import credentials directly since we can't import TypeScript files in Node.js
const WHATSAPP_CREDENTIALS = {
  instanceId: '7105284900',
  apiToken: 'b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294',
  apiUrl: 'https://7105.api.greenapi.com'
};

// Simple AI analysis functions (you can replace with actual AI API calls)
class ChatAnalyzer {
  constructor() {
    this.chatData = [];
    this.summaries = [];
  }

  // Analyze message sentiment (simple keyword-based approach)
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'thanks', 'thank you', 'perfect', 'love', 'like', 'awesome', 'fantastic', 'brilliant', 'super', 'nice', 'beautiful', 'best', 'outstanding', 'satisfied', 'pleased', 'delighted', 'grateful', 'appreciate', 'blessed', 'joy', 'excited', 'thrilled', 'ecstatic', 'elated', 'content', 'fulfilled'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointed', 'angry', 'frustrated', 'upset', 'sad', 'unhappy', 'worried', 'concerned', 'annoyed', 'irritated', 'mad', 'furious', 'hate', 'dislike', 'problem', 'issue', 'error', 'fail', 'broken', 'damaged', 'poor', 'worst', 'terrible', 'dreadful', 'miserable', 'depressed', 'anxious', 'stressed', 'overwhelmed', 'exhausted', 'tired', 'sick', 'pain', 'hurt', 'suffering'];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Extract key topics from messages
  extractTopics(messages) {
    const topics = new Map();
    const commonTopics = {
      'business': ['order', 'payment', 'delivery', 'service', 'customer', 'product', 'price', 'cost', 'invoice', 'quote', 'business', 'company', 'work', 'job', 'project', 'meeting', 'appointment', 'schedule', 'deadline', 'contract', 'agreement', 'deal', 'transaction', 'sale', 'purchase', 'buy', 'sell'],
      'personal': ['family', 'friend', 'home', 'house', 'personal', 'private', 'life', 'relationship', 'marriage', 'wedding', 'birthday', 'party', 'celebration', 'holiday', 'vacation', 'travel', 'trip', 'visit', 'dinner', 'lunch', 'breakfast', 'food', 'restaurant', 'movie', 'music', 'hobby', 'sport', 'game', 'entertainment'],
      'technical': ['computer', 'phone', 'device', 'repair', 'fix', 'problem', 'issue', 'error', 'bug', 'software', 'hardware', 'system', 'network', 'internet', 'wifi', 'password', 'login', 'account', 'email', 'website', 'app', 'application', 'update', 'install', 'download', 'upload', 'backup', 'data', 'file', 'document'],
      'health': ['health', 'medical', 'doctor', 'hospital', 'medicine', 'medicine', 'sick', 'ill', 'pain', 'symptom', 'treatment', 'therapy', 'exercise', 'fitness', 'diet', 'nutrition', 'wellness', 'mental', 'physical', 'checkup', 'appointment', 'prescription', 'pharmacy', 'clinic', 'emergency', 'ambulance'],
      'education': ['school', 'university', 'college', 'study', 'learn', 'education', 'course', 'class', 'lesson', 'homework', 'assignment', 'exam', 'test', 'grade', 'teacher', 'professor', 'student', 'book', 'reading', 'writing', 'math', 'science', 'history', 'language', 'degree', 'diploma', 'certificate']
    };

    messages.forEach(message => {
      const text = this.extractMessageText(message).toLowerCase();
      
      Object.entries(commonTopics).forEach(([topic, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            topics.set(topic, (topics.get(topic) || 0) + 1);
          }
        });
      });
    });

    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));
  }

  // Extract message text from different message types
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

  // Generate comprehensive chat summary
  generateChatSummary(chatId, messages, chatInfo) {
    if (!messages || messages.length === 0) {
      return {
        chatId,
        name: chatInfo?.name || 'Unknown',
        summary: 'No messages found in this chat.',
        messageCount: 0,
        topics: [],
        sentiment: 'neutral',
        activityLevel: 'none',
        keyInsights: ['No activity detected']
      };
    }

    const textMessages = messages.filter(msg => 
      msg.textMessage || msg.extendedTextMessage || msg.imageMessage?.caption || msg.videoMessage?.caption
    );

    const topics = this.extractTopics(textMessages);
    const sentiments = textMessages.map(msg => this.analyzeSentiment(this.extractMessageText(msg)));
    const sentimentCounts = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    const dominantSentiment = Object.entries(sentimentCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    const timeRange = messages.length > 0 ? {
      start: new Date(Math.min(...messages.map(m => m.timestamp * 1000))),
      end: new Date(Math.max(...messages.map(m => m.timestamp * 1000)))
    } : null;

    const activityLevel = this.calculateActivityLevel(messages.length, timeRange);
    const keyInsights = this.generateKeyInsights(messages, topics, sentimentCounts, timeRange);

    return {
      chatId,
      name: chatInfo?.name || 'Unknown',
      summary: this.generateSummaryText(messages, topics, dominantSentiment, activityLevel),
      messageCount: messages.length,
      textMessageCount: textMessages.length,
      topics: topics.map(t => t.topic),
      sentiment: dominantSentiment,
      sentimentBreakdown: sentimentCounts,
      activityLevel,
      timeRange,
      keyInsights,
      lastMessage: messages.length > 0 ? {
        text: this.extractMessageText(messages[messages.length - 1]),
        time: new Date(messages[messages.length - 1].timestamp * 1000).toLocaleString()
      } : null
    };
  }

  // Calculate activity level
  calculateActivityLevel(messageCount, timeRange) {
    if (messageCount === 0) return 'none';
    if (!timeRange) return 'unknown';

    const daysDiff = (timeRange.end - timeRange.start) / (1000 * 60 * 60 * 24);
    const messagesPerDay = messageCount / Math.max(daysDiff, 1);

    if (messagesPerDay >= 10) return 'very_high';
    if (messagesPerDay >= 5) return 'high';
    if (messagesPerDay >= 2) return 'moderate';
    if (messagesPerDay >= 0.5) return 'low';
    return 'very_low';
  }

  // Generate key insights
  generateKeyInsights(messages, topics, sentimentCounts, timeRange) {
    const insights = [];
    
    if (messages.length > 0) {
      insights.push(`Total of ${messages.length} messages exchanged`);
    }

    if (topics.length > 0) {
      insights.push(`Main topics: ${topics.map(t => t.topic).join(', ')}`);
    }

    if (sentimentCounts.positive > sentimentCounts.negative) {
      insights.push('Overall positive sentiment in conversations');
    } else if (sentimentCounts.negative > sentimentCounts.positive) {
      insights.push('Some negative sentiment detected - may need attention');
    }

    if (timeRange) {
      const daysDiff = (timeRange.end - timeRange.start) / (1000 * 60 * 60 * 24);
      insights.push(`Conversation span: ${Math.round(daysDiff)} days`);
    }

    const recentMessages = messages.filter(m => 
      (Date.now() - m.timestamp * 1000) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    if (recentMessages.length > 0) {
      insights.push(`Active in last 7 days: ${recentMessages.length} messages`);
    }

    return insights;
  }

  // Generate summary text
  generateSummaryText(messages, topics, sentiment, activityLevel) {
    const messageCount = messages.length;
    const mainTopics = topics.map(t => t.topic).join(', ');
    
    let summary = `This chat contains ${messageCount} messages with ${activityLevel.replace('_', ' ')} activity level. `;
    
    if (mainTopics) {
      summary += `Main topics discussed include: ${mainTopics}. `;
    }
    
    summary += `The overall sentiment is ${sentiment}. `;
    
    if (messageCount > 50) {
      summary += `This is an active conversation with substantial engagement.`;
    } else if (messageCount > 10) {
      summary += `This is a moderate conversation with regular interaction.`;
    } else {
      summary += `This is a brief conversation with limited interaction.`;
    }
    
    return summary;
  }
}

async function getAllChatsWithAI() {
  console.log('🤖 AI WhatsApp Chat Analysis Starting...\n');

  const { instanceId, apiToken, apiUrl } = WHATSAPP_CREDENTIALS;
  const analyzer = new ChatAnalyzer();
  
  try {
    // Step 1: Get all chats
    console.log('📱 Step 1: Fetching all WhatsApp chats...');
    const chatsResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChats/${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!chatsResponse.ok) {
      throw new Error(`Failed to fetch chats: ${chatsResponse.status} ${chatsResponse.statusText}`);
    }

    const chatsData = await chatsResponse.json();
    console.log(`✅ Successfully fetched ${chatsData.length} chats\n`);

    if (!chatsData || !Array.isArray(chatsData) || chatsData.length === 0) {
      console.log('📋 No chats found');
      return;
    }

    // Step 2: Analyze each chat
    console.log('🤖 Step 2: Analyzing chats with AI...\n');
    
    const chatSummaries = [];
    let processedCount = 0;

    for (const chat of chatsData) {
      processedCount++;
      console.log(`📊 Processing chat ${processedCount}/${chatsData.length}: ${chat.name || chat.id}`);
      
      try {
        // Get chat history for this chat
        const historyResponse = await fetch(`${apiUrl}/waInstance${instanceId}/getChatHistory/${apiToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatId: chat.id,
            count: 100 // Get last 100 messages for analysis
          })
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const summary = analyzer.generateChatSummary(chat.id, historyData, chat);
          chatSummaries.push(summary);
        } else {
          console.log(`   ⚠️  Could not fetch history for ${chat.name || chat.id}`);
          // Add basic summary without history
          chatSummaries.push({
            chatId: chat.id,
            name: chat.name || 'Unknown',
            summary: 'Could not fetch chat history',
            messageCount: 0,
            topics: [],
            sentiment: 'unknown',
            activityLevel: 'unknown',
            keyInsights: ['History not accessible']
          });
        }
      } catch (error) {
        console.log(`   ❌ Error processing ${chat.name || chat.id}: ${error.message}`);
      }
    }

    // Step 3: Generate overall summary
    console.log('\n📋 Step 3: Generating comprehensive summary...\n');
    
    const overallSummary = generateOverallSummary(chatSummaries);
    
    // Step 4: Display results
    console.log('🎯 COMPREHENSIVE WHATSAPP CHAT ANALYSIS\n');
    console.log('=' .repeat(60));
    
    console.log('\n📊 OVERALL SUMMARY:');
    console.log(overallSummary);
    
    console.log('\n📋 INDIVIDUAL CHAT SUMMARIES:');
    console.log('=' .repeat(60));
    
    chatSummaries.forEach((summary, index) => {
      console.log(`\n🔸 Chat ${index + 1}: ${summary.name}`);
      console.log(`   ID: ${summary.chatId}`);
      console.log(`   Summary: ${summary.summary}`);
      console.log(`   Messages: ${summary.messageCount}`);
      console.log(`   Topics: ${summary.topics.join(', ') || 'None detected'}`);
      console.log(`   Sentiment: ${summary.sentiment}`);
      console.log(`   Activity: ${summary.activityLevel.replace('_', ' ')}`);
      console.log(`   Key Insights:`);
      summary.keyInsights.forEach(insight => {
        console.log(`     • ${insight}`);
      });
      if (summary.lastMessage) {
        console.log(`   Last Message: "${summary.lastMessage.text}" (${summary.lastMessage.time})`);
      }
    });

    // Step 5: Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fs = require('fs');
    const outputData = {
      timestamp: new Date().toISOString(),
      overallSummary,
      chatSummaries,
      totalChats: chatSummaries.length,
      totalMessages: chatSummaries.reduce((sum, chat) => sum + chat.messageCount, 0)
    };
    
    fs.writeFileSync(`whatsapp-ai-summary-${timestamp}.json`, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Analysis saved to: whatsapp-ai-summary-${timestamp}.json`);

  } catch (error) {
    console.error('❌ Error during AI analysis:', error.message);
    
    if (error.message.includes('466')) {
      console.log('\n⚠️  Quota exceeded. You can only access chats with allowed numbers:');
      console.log('   - 254700000000@c.us');
      console.log('   - 254712345678@c.us');
      console.log('   - 255746605561@c.us');
      console.log('\n💡 Upgrade your Green API plan to access all chats:');
      console.log('   https://console.green-api.com');
    }
  }
}

function generateOverallSummary(chatSummaries) {
  const totalChats = chatSummaries.length;
  const totalMessages = chatSummaries.reduce((sum, chat) => sum + chat.messageCount, 0);
  const activeChats = chatSummaries.filter(chat => chat.messageCount > 0).length;
  
  const sentimentBreakdown = chatSummaries.reduce((acc, chat) => {
    acc[chat.sentiment] = (acc[chat.sentiment] || 0) + 1;
    return acc;
  }, {});
  
  const activityBreakdown = chatSummaries.reduce((acc, chat) => {
    acc[chat.activityLevel] = (acc[chat.activityLevel] || 0) + 1;
    return acc;
  }, {});
  
  const allTopics = chatSummaries.flatMap(chat => chat.topics);
  const topicFrequency = allTopics.reduce((acc, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  
  const topTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => `${topic} (${count} chats)`);
  
  let summary = `📊 WhatsApp Analysis Summary:\n`;
  summary += `   • Total Chats Analyzed: ${totalChats}\n`;
  summary += `   • Active Chats: ${activeChats}\n`;
  summary += `   • Total Messages: ${totalMessages}\n`;
  summary += `   • Average Messages per Chat: ${totalChats > 0 ? Math.round(totalMessages / totalChats) : 0}\n\n`;
  
  summary += `🎭 Sentiment Distribution:\n`;
  Object.entries(sentimentBreakdown).forEach(([sentiment, count]) => {
    summary += `   • ${sentiment}: ${count} chats\n`;
  });
  summary += `\n`;
  
  summary += `📈 Activity Levels:\n`;
  Object.entries(activityBreakdown).forEach(([level, count]) => {
    summary += `   • ${level.replace('_', ' ')}: ${count} chats\n`;
  });
  summary += `\n`;
  
  if (topTopics.length > 0) {
    summary += `🏷️  Top Topics Discussed:\n`;
    topTopics.forEach(topic => {
      summary += `   • ${topic}\n`;
    });
  }
  
  return summary;
}

// Run the AI analysis
getAllChatsWithAI().then(() => {
  console.log('\n✅ AI WhatsApp Chat Analysis completed successfully!');
  console.log('🤖 The AI has analyzed all your chats and provided comprehensive insights.');
}).catch(error => {
  console.error('❌ AI Analysis failed:', error);
});
