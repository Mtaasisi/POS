#!/usr/bin/env node

/**
 * Chat Analyzer for AI Training
 * This script analyzes chat conversations to learn response patterns
 * and train the AI based on actual customer interactions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// Sample chat data structure (you can replace this with your actual chat data)
const SAMPLE_CHAT_DATA = [
  {
    customer: "Hi, do you repair phones?",
    your_response: "Yes! Tuna huduma za kurekebisha simu, laptop, na vifaa vingine. Una tatizo gani? Unaweza kuja ofisini au tutumie technician kwenu.",
    category: "service_inquiry"
  },
  {
    customer: "What's the price for screen replacement?",
    your_response: "Bei ya kubadili screen hutofautiana: iPhone 50,000-150,000, Samsung 30,000-100,000, Huawei 25,000-80,000. Tafadhali tuambie aina ya simu yako.",
    category: "pricing"
  },
  {
    customer: "My phone is not charging",
    your_response: "Tunaona tatizo lako! Hiyo inaweza kuwa battery au charging port. Mtaalamu wetu atakusaidia haraka. Unaweza kuja leo au kesho? Au tutumie technician kwenu.",
    category: "technical_support"
  },
  {
    customer: "Where are you located?",
    your_response: "Tupo Dar es Salaam! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie mahali ulipo (mtaa, jiji) ili tupate kukusaidia.",
    category: "location"
  },
  {
    customer: "Do you work on weekends?",
    your_response: "Tuna kazi Jumamosi na Jumapili pia! Masaa: 8:00 AM - 8:00 PM. Unaweza kuja weekend au tutumie technician kwenu.",
    category: "schedule"
  },
  {
    customer: "How much for iPhone battery replacement?",
    your_response: "Bei ya kubadili battery ya iPhone: 25,000-50,000 kulingana na model. Tuna dhamana ya siku 30. Unaweza kuja ofisini au tutumie technician kwenu.",
    category: "pricing"
  },
  {
    customer: "I need urgent repair",
    your_response: "Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Unaweza kuja ofisini sasa au tutumie technician kwenu mara moja. Tafadhali tuambie tatizo lako kwa undani zaidi.",
    category: "urgent"
  },
  {
    customer: "Do you have warranty?",
    your_response: "Tuna dhamana ya siku 30 kwa huduma zetu. Ikiwa kuna tatizo tena ndani ya siku 30, tutarekebisha bila malipo. Tuna uhakika wa huduma bora!",
    category: "warranty"
  },
  {
    customer: "Can you come to my house?",
    your_response: "Ndio! Tuna huduma za technician kwenu. Bei: Tsh 10,000 kwa huduma ya technician. Tafadhali tuambie mahali ulipo na tutumie mtaalamu kwenu.",
    category: "appointment"
  },
  {
    customer: "Thank you for the good service",
    your_response: "Asante sana! Tunafurahi kukusaidia. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora kila wakati. Karibu tena!",
    category: "appreciation"
  }
];

// Function to analyze chat patterns
function analyzeChatPatterns(chatData) {
  console.log('🔍 Analyzing Chat Patterns...\n');

  const patterns = {
    categories: {},
    common_phrases: {},
    response_templates: {},
    keywords: {}
  };

  chatData.forEach((chat, index) => {
    const customerMsg = chat.customer.toLowerCase();
    const yourResponse = chat.your_response;
    const category = chat.category;

    // Track categories
    if (!patterns.categories[category]) {
      patterns.categories[category] = [];
    }
    patterns.categories[category].push({
      customer: chat.customer,
      response: yourResponse
    });

    // Extract keywords from customer messages
    const words = customerMsg.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) { // Ignore short words
        if (!patterns.keywords[word]) {
          patterns.keywords[word] = 0;
        }
        patterns.keywords[word]++;
      }
    });

    // Track common phrases
    const phrases = extractPhrases(customerMsg);
    phrases.forEach(phrase => {
      if (!patterns.common_phrases[phrase]) {
        patterns.common_phrases[phrase] = [];
      }
      patterns.common_phrases[phrase].push(yourResponse);
    });

    console.log(`${index + 1}. Customer: "${chat.customer}"`);
    console.log(`   Category: ${category}`);
    console.log(`   Your Response: "${yourResponse}"`);
    console.log(`   Keywords: ${words.filter(w => w.length > 2).join(', ')}`);
    console.log('');
  });

  return patterns;
}

// Function to extract meaningful phrases
function extractPhrases(text) {
  const phrases = [];
  const words = text.split(/\s+/);
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  
  return phrases;
}

// Function to generate AI training data from chat patterns
function generateAITrainingData(patterns) {
  console.log('🤖 Generating AI Training Data...\n');

  const trainingData = {};

  // Process each category
  Object.entries(patterns.categories).forEach(([category, conversations]) => {
    trainingData[category] = {
      patterns: [],
      responses: [],
      confidence: 0.8
    };

    conversations.forEach(conv => {
      const customerMsg = conv.customer.toLowerCase();
      
      // Extract patterns from customer message
      const words = customerMsg.split(/\s+/);
      const phrases = extractPhrases(customerMsg);
      
      // Add individual words as patterns
      words.forEach(word => {
        if (word.length > 2 && !trainingData[category].patterns.includes(word)) {
          trainingData[category].patterns.push(word);
        }
      });
      
      // Add phrases as patterns
      phrases.forEach(phrase => {
        if (phrase.length > 3 && !trainingData[category].patterns.includes(phrase)) {
          trainingData[category].patterns.push(phrase);
        }
      });
      
      // Add response if not already included
      if (!trainingData[category].responses.includes(conv.response)) {
        trainingData[category].responses.push(conv.response);
      }
    });
  });

  return trainingData;
}

// Function to save training data to database
async function saveTrainingDataToDatabase(trainingData) {
  console.log('💾 Saving Training Data to Database...\n');

  for (const [category, data] of Object.entries(trainingData)) {
    console.log(`📝 Processing category: ${category}`);
    console.log(`   Patterns: ${data.patterns.length}`);
    console.log(`   Responses: ${data.responses.length}`);
    
    // Save to database (you can implement this based on your database structure)
    try {
      const { data: result, error } = await supabase
        .from('ai_training_patterns')
        .upsert({
          category: category,
          patterns: data.patterns,
          responses: data.responses,
          confidence: data.confidence,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.log(`   ⚠️  Database error for ${category}: ${error.message}`);
      } else {
        console.log(`   ✅ Saved ${category} successfully`);
      }
    } catch (error) {
      console.log(`   ❌ Error saving ${category}: ${error.message}`);
    }
  }
}

// Function to generate AI code from training data
function generateAICode(trainingData) {
  console.log('💻 Generating AI Code...\n');

  let aiCode = `// AI Training Data Generated from Chat Analysis\n`;
  aiCode += `// Generated on: ${new Date().toISOString()}\n\n`;

  aiCode += `// Enhanced AI analysis function based on your chat patterns\n`;
  aiCode += `function analyzeMessageWithTrainedAI(messageText, sender) {\n`;
  aiCode += `  const lowerMessage = messageText.toLowerCase();\n\n`;
  aiCode += `  const analysis = {\n`;
  aiCode += `    shouldReply: false,\n`;
  aiCode += `    confidence: 0.5,\n`;
  aiCode += `    action: 'ignore',\n`;
  aiCode += `    category: 'other',\n`;
  aiCode += `    replyMessage: null\n`;
  aiCode += `  };\n\n`;

  // Generate code for each category
  Object.entries(trainingData).forEach(([category, data]) => {
    const patterns = data.patterns.map(p => `'${p}'`).join(' || lowerMessage.includes(');
    
    aiCode += `  // ${category.toUpperCase()} - Based on your chat patterns\n`;
    aiCode += `  if (lowerMessage.includes(${patterns})) {\n`;
    aiCode += `    analysis.shouldReply = true;\n`;
    aiCode += `    analysis.confidence = ${data.confidence};\n`;
    aiCode += `    analysis.action = 'auto_reply';\n`;
    aiCode += `    analysis.category = '${category}';\n`;
    
    // Select a random response
    if (data.responses.length > 0) {
      const randomResponse = data.responses[Math.floor(Math.random() * data.responses.length)];
      aiCode += `    analysis.replyMessage = '${randomResponse.replace(/'/g, "\\'")}';\n`;
    }
    
    aiCode += `  }\n\n`;
  });

  aiCode += `  return analysis;\n`;
  aiCode += `}\n`;

  return aiCode;
}

// Function to analyze your actual chat data
async function analyzeYourChatData() {
  console.log('📊 Chat Analysis for AI Training\n');
  console.log('This will analyze your chat conversations and train the AI\n');

  // Step 1: Analyze patterns
  const patterns = analyzeChatPatterns(SAMPLE_CHAT_DATA);
  
  // Step 2: Generate training data
  const trainingData = generateAITrainingData(patterns);
  
  // Step 3: Save to database
  await saveTrainingDataToDatabase(trainingData);
  
  // Step 4: Generate AI code
  const aiCode = generateAICode(trainingData);
  
  // Save the generated code
  const outputPath = 'generated-ai-code.js';
  fs.writeFileSync(outputPath, aiCode);
  
  console.log(`✅ Generated AI code saved to: ${outputPath}`);
  console.log('\n📋 Summary:');
  console.log(`   Categories analyzed: ${Object.keys(trainingData).length}`);
  console.log(`   Total patterns extracted: ${Object.values(trainingData).reduce((sum, data) => sum + data.patterns.length, 0)}`);
  console.log(`   Total responses learned: ${Object.values(trainingData).reduce((sum, data) => sum + data.responses.length, 0)}`);
  
  return trainingData;
}

// Function to import your actual chat data
function importChatData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      console.log(`❌ File not found: ${filePath}`);
      console.log('Using sample data instead...');
      return SAMPLE_CHAT_DATA;
    }
  } catch (error) {
    console.log(`❌ Error reading file: ${error.message}`);
    console.log('Using sample data instead...');
    return SAMPLE_CHAT_DATA;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('📊 Chat Analyzer for AI Training\n');

  switch (command) {
    case 'analyze':
      await analyzeYourChatData();
      break;
    
    case 'import':
      const filePath = args[1];
      if (!filePath) {
        console.log('❌ Please provide file path');
        console.log('Usage: node chat-analyzer.js import <file_path>');
        return;
      }
      
      const chatData = importChatData(filePath);
      const patterns = analyzeChatPatterns(chatData);
      const trainingData = generateAITrainingData(patterns);
      await saveTrainingDataToDatabase(trainingData);
      break;
    
    case 'sample':
      console.log('📝 Sample Chat Data Format:\n');
      console.log(JSON.stringify(SAMPLE_CHAT_DATA, null, 2));
      break;
    
    default:
      console.log('📊 Chat Analyzer Commands:');
      console.log('  analyze              - Analyze sample chat data and generate AI training');
      console.log('  import <file_path>   - Import and analyze your actual chat data');
      console.log('  sample               - Show sample chat data format');
      console.log('');
      console.log('Examples:');
      console.log('  node chat-analyzer.js analyze');
      console.log('  node chat-analyzer.js import my-chats.json');
      console.log('  node chat-analyzer.js sample');
      break;
  }
}

// Run the script
main().catch(console.error);
