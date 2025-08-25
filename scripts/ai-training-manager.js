#!/usr/bin/env node

/**
 * AI Training Manager for WhatsApp Customer Service
 * This script helps manage and train the AI system for better customer interactions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// AI Training Data Structure
const AI_TRAINING_DATA = {
  categories: {
    greeting: {
      patterns: [
        'hi', 'hello', 'hey', 'mambo', 'jambo', 'habari', 'hujambo', 'shikamoo',
        'marahaba', 'salaam', 'asalaam', 'good morning', 'good afternoon', 'good evening'
      ],
      responses: [
        'Mambo! Karibu kwenye LATS CHANCE. Tuna huduma za kurekebisha vifaa na kuuza. Una tatizo gani? Unaweza kuja ofisini au tutumie technician kwenu.',
        'Jambo! Karibu kwenye LATS CHANCE. Tuna huduma za kurekebisha simu, laptop, na vifaa vingine. Una tatizo gani?',
        'Habari! Karibu kwenye huduma zetu. Tunaweza kukusaidia na tatizo lolote la vifaa. Una tatizo gani?'
      ],
      confidence: 0.9
    },
    pricing: {
      patterns: [
        'price', 'bei', 'cost', 'gharama', 'how much', 'ni bei gani', 'pesa', 'money',
        'charge', 'fee', 'expense', 'budget', 'cheap', 'expensive', 'affordable', 'reasonable'
      ],
      responses: [
        'Asante kwa ujumbe wako! Bei zetu hutofautiana kulingana na tatizo na vifaa. Kwa huduma za technician: Tsh 10,000-50,000. Kwa spare parts: Bei hutofautiana. Unaweza kuja ofisini au tutumie technician kwenu kwa bei ya Tsh 10,000. Tafadhali tuambie tatizo lako kwa undani zaidi.',
        'Bei zetu ni nafuu na za kusikika! Kwa huduma za technician: Tsh 10,000-50,000. Kwa spare parts: Bei hutofautiana kulingana na vifaa. Unaweza kuja ofisini au tutumie technician kwenu.',
        'Tuna bei nzuri na za kusikika! Kwa huduma za technician: Tsh 10,000-50,000. Kwa spare parts: Bei hutofautiana. Tafadhali tuambie tatizo lako kwa undani zaidi.'
      ],
      confidence: 0.8
    },
    technical_support: {
      patterns: [
        'repair', 'rekebisha', 'fix', 'tatizo', 'problem', 'not working', 'broken', 'imeharibika',
        'damaged', 'haribika', 'screen', 'battery', 'charging', 'simu', 'phone', 'laptop',
        'computer', 'vifaa', 'device', 'hardware', 'software', 'virus', 'slow', 'polepole',
        'hanging', 'freeze'
      ],
      responses: [
        'Tunaona tatizo lako! Mtaalamu wetu atakusaidia haraka. Tuna huduma za kurekebisha simu, laptop, computer, na vifaa vingine. Unaweza kuja leo au kesho? Au tutumie technician kwenu. Tafadhali tuambie tatizo lako kwa undani zaidi ili tupate kukusaidia vizuri.',
        'Tunaweza kutatua tatizo lako! Mtaalamu wetu atakusaidia haraka. Tuna huduma za kurekebisha simu, laptop, computer, na vifaa vingine. Unaweza kuja ofisini au tutumie technician kwenu.',
        'Tatizo lako litatatuliwa! Mtaalamu wetu atakusaidia haraka. Tuna huduma za kurekebisha simu, laptop, computer, na vifaa vingine. Tafadhali tuambie tatizo lako kwa undani zaidi.'
      ],
      confidence: 0.8
    },
    service_inquiry: {
      patterns: [
        'service', 'huduma', 'what do you do', 'una huduma gani', 'help', 'msaada',
        'business', 'biashara', 'work', 'kazi', 'specialize', 'expertise', 'offer',
        'provide', 'sell', 'auza', 'buy', 'nunua'
      ],
      responses: [
        'Tuna huduma za kurekebisha simu, laptop, computer, na vifaa vingine. Pia tunaauza vifaa vipya na accessories. Huduma zetu: 1) Kurekebisha vifaa 2) Kuuza spare parts 3) Kuuza vifaa vipya 4) Huduma za technician. Una tatizo gani? Unaweza kuja ofisini au tutumie technician kwenu.',
        'Tuna huduma mbalimbali: 1) Kurekebisha vifaa 2) Kuuza spare parts 3) Kuuza vifaa vipya 4) Huduma za technician. Una tatizo gani? Unaweza kuja ofisini au tutumie technician kwenu.',
        'Tuna huduma za kurekebisha simu, laptop, computer, na vifaa vingine. Pia tunaauza vifaa vipya na accessories. Una tatizo gani?'
      ],
      confidence: 0.7
    },
    location: {
      patterns: [
        'where', 'wapi', 'location', 'mahali', 'address', 'anwani', 'place', 'duka',
        'shop', 'store', 'office', 'ofisi', 'area', 'mtaa', 'street', 'road',
        'near', 'karibu', 'far', 'mbali'
      ],
      responses: [
        'Tupo Dar es Salaam! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie mahali ulipo (mtaa, jiji) ili tupate kukusaidia na kukupa maelezo sahihi zaidi. Pia tunaweza kutumia technician kwenu kama uko karibu.',
        'Tupo Dar es Salaam! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie mahali ulipo ili tupate kukusaidia.',
        'Tupo Dar es Salaam! Unaweza kuja ofisini au tutumie technician kwenu. Pia tunaweza kutumia technician kwenu kama uko karibu.'
      ],
      confidence: 0.7
    },
    schedule: {
      patterns: [
        'when', 'lini', 'time', 'muda', 'today', 'leo', 'tomorrow', 'kesho',
        'morning', 'asubuhi', 'afternoon', 'mchana', 'evening', 'jioni', 'night', 'usiku',
        'open', 'fungua', 'close', 'fungwa', 'available', 'patikana', 'busy', 'occupied'
      ],
      responses: [
        'Tuna kazi siku zote! Masaa yetu: Jumatatu-Jumapili, 8:00 AM - 8:00 PM. Unaweza kuja leo au kesho. Au tutumie technician kwenu. Tafadhali tuambie lini ungependa kusaidia na tutapanga muda sahihi.',
        'Tuna kazi siku zote! Masaa yetu: Jumatatu-Jumapili, 8:00 AM - 8:00 PM. Unaweza kuja leo au kesho.',
        'Tuna kazi siku zote! Masaa yetu: Jumatatu-Jumapili, 8:00 AM - 8:00 PM. Au tutumie technician kwenu.'
      ],
      confidence: 0.6
    },
    urgent: {
      patterns: [
        'urgent', 'haraka', 'emergency', 'dharura', 'now', 'sasa', 'immediately', 'mara moja',
        'quick', 'fast', 'asap', 'rush', 'important', 'muhimu', 'critical', 'kubwa'
      ],
      responses: [
        'Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Unaweza kuja ofisini sasa au tutumie technician kwenu mara moja. Tafadhali tuambie tatizo lako kwa undani zaidi ili tupate kukusaidia haraka.',
        'Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Unaweza kuja ofisini sasa au tutumie technician kwenu mara moja.',
        'Tunaona hiyo ni dharura! Tutakusaidia haraka iwezekanavyo. Tafadhali tuambie tatizo lako kwa undani zaidi.'
      ],
      confidence: 0.8
    },
    appointment: {
      patterns: [
        'appointment', 'muda', 'booking', 'reserve', 'schedule', 'mpango', 'meet', 'kutana',
        'visit', 'tembelea', 'come', 'kuja', 'send', 'tuma', 'call', 'piga'
      ],
      responses: [
        'Asante kwa kupenda kuja! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie: 1) Lini ungependa kuja? 2) Tatizo lako ni nini? 3) Mahali ulipo? Tutapanga muda sahihi na kukusaidia haraka.',
        'Asante kwa kupenda kuja! Unaweza kuja ofisini au tutumie technician kwenu. Tafadhali tuambie lini ungependa kuja na tatizo lako.',
        'Asante kwa kupenda kuja! Unaweza kuja ofisini au tutumie technician kwenu. Tutapanga muda sahihi.'
      ],
      confidence: 0.6
    },
    complaint: {
      patterns: [
        'complaint', 'malalamiko', 'problem', 'tatizo', 'bad', 'mbaya', 'poor', 'duni',
        'wrong', 'makosa', 'error', 'kosa', 'not good', 'si nzuri', 'disappointed', 'kukata tamaa',
        'angry', 'hasira'
      ],
      responses: [
        'Pole sana kwa tatizo lako! Tunajali huduma zetu na tunataka kuhakikisha una huduma bora. Tafadhali tuambie tatizo lako kwa undani zaidi ili tupate kukusaidia na kutatua tatizo. Tutafanya kila lawezekana kuhakikisha una huduma bora.',
        'Pole sana kwa tatizo lako! Tunajali huduma zetu na tunataka kuhakikisha una huduma bora. Tafadhali tuambie tatizo lako kwa undani zaidi.',
        'Pole sana kwa tatizo lako! Tunajali huduma zetu na tunataka kuhakikisha una huduma bora. Tutafanya kila lawezekana kuhakikisha una huduma bora.'
      ],
      confidence: 0.7
    },
    appreciation: {
      patterns: [
        'thank', 'asante', 'thanks', 'shukrani', 'appreciate', 'shukuru', 'good', 'nzuri',
        'great', 'bora', 'excellent', 'bora sana', 'perfect', 'kamili', 'satisfied', 'radhi'
      ],
      responses: [
        'Asante sana! Tunafurahi kukusaidia. Ikiwa una tatizo lolote linalohitaji msaada, usisite kututafuta. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora kila wakati. Karibu tena!',
        'Asante sana! Tunafurahi kukusaidia. Ikiwa una tatizo lolote linalohitaji msaada, usisite kututafuta.',
        'Asante sana! Tunafurahi kukusaidia. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora kila wakati.'
      ],
      confidence: 0.6
    },
    goodbye: {
      patterns: [
        'bye', 'kwaheri', 'goodbye', 'tutaonana', 'see you', 'tutaona', 'later', 'baadaye',
        'end', 'mwisho', 'stop', 'acha', 'finish', 'maliza'
      ],
      responses: [
        'Kwaheri! Asante kwa kututafuta. Ikiwa una tatizo lolote linalohitaji msaada, usisite kututafuta tena. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora. Karibu tena!',
        'Kwaheri! Asante kwa kututafuta. Ikiwa una tatizo lolote linalohitaji msaada, usisite kututafuta tena.',
        'Kwaheri! Asante kwa kututafuta. Tunajali huduma zetu na tunataka kuhakikisha una huduma bora. Karibu tena!'
      ],
      confidence: 0.5
    }
  }
};

// Function to analyze message with enhanced AI
function analyzeMessageWithEnhancedAI(messageText, sender) {
  const lowerMessage = messageText.toLowerCase();
  
  const analysis = {
    shouldReply: false,
    confidence: 0.5,
    action: 'ignore',
    category: 'other',
    replyMessage: null,
    matchedPatterns: [],
    categoryDetails: null
  };

  // Check each category
  for (const [categoryName, categoryData] of Object.entries(AI_TRAINING_DATA.categories)) {
    const matchedPatterns = categoryData.patterns.filter(pattern => 
      lowerMessage.includes(pattern.toLowerCase())
    );

    if (matchedPatterns.length > 0) {
      analysis.shouldReply = true;
      analysis.confidence = categoryData.confidence;
      analysis.action = 'auto_reply';
      analysis.category = categoryName;
      analysis.matchedPatterns = matchedPatterns;
      analysis.categoryDetails = categoryData;
      
      // Select a random response from the category
      const randomIndex = Math.floor(Math.random() * categoryData.responses.length);
      analysis.replyMessage = categoryData.responses[randomIndex];
      
      break; // Use the first matching category
    }
  }

  return analysis;
}

// Function to add new training data
async function addTrainingData(category, patterns, responses, confidence = 0.7) {
  try {
    // Add to local training data
    if (!AI_TRAINING_DATA.categories[category]) {
      AI_TRAINING_DATA.categories[category] = {
        patterns: [],
        responses: [],
        confidence: confidence
      };
    }

    AI_TRAINING_DATA.categories[category].patterns.push(...patterns);
    AI_TRAINING_DATA.categories[category].responses.push(...responses);
    AI_TRAINING_DATA.categories[category].confidence = confidence;

    // Save to database
    const { data, error } = await supabase
      .from('ai_training_data')
      .upsert({
        category: category,
        patterns: patterns,
        responses: responses,
        confidence: confidence,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error saving training data:', error);
      return false;
    }

    console.log(`✅ Training data added for category: ${category}`);
    return true;
  } catch (error) {
    console.error('❌ Error adding training data:', error);
    return false;
  }
}

// Function to test AI responses
function testAIResponses() {
  console.log('🧪 Testing AI Responses...\n');

  const testMessages = [
    'Hi there!',
    'What are your prices?',
    'My phone is broken',
    'Where is your shop?',
    'When are you open?',
    'This is urgent!',
    'I want to make an appointment',
    'Your service is bad',
    'Thank you so much!',
    'Goodbye!'
  ];

  testMessages.forEach(message => {
    const analysis = analyzeMessageWithEnhancedAI(message, 'test');
    console.log(`📝 Message: "${message}"`);
    console.log(`   Category: ${analysis.category}`);
    console.log(`   Confidence: ${analysis.confidence}`);
    console.log(`   Should Reply: ${analysis.shouldReply}`);
    console.log(`   Response: ${analysis.replyMessage}`);
    console.log(`   Matched Patterns: ${analysis.matchedPatterns.join(', ')}`);
    console.log('');
  });
}

// Function to show current training data
function showTrainingData() {
  console.log('📊 Current AI Training Data:\n');

  for (const [categoryName, categoryData] of Object.entries(AI_TRAINING_DATA.categories)) {
    console.log(`🏷️  Category: ${categoryName.toUpperCase()}`);
    console.log(`   Confidence: ${categoryData.confidence}`);
    console.log(`   Patterns (${categoryData.patterns.length}): ${categoryData.patterns.join(', ')}`);
    console.log(`   Responses (${categoryData.responses.length}):`);
    categoryData.responses.forEach((response, index) => {
      console.log(`     ${index + 1}. ${response}`);
    });
    console.log('');
  }
}

// Function to add custom training data
async function addCustomTraining() {
  console.log('🎯 Adding Custom Training Data\n');

  // Example: Add Swahili greetings
  await addTrainingData(
    'swahili_greetings',
    ['shikamoo', 'marahaba', 'hujambo', 'sijambo'],
    [
      'Shikamoo! Karibu kwenye LATS CHANCE. Tuna huduma za kurekebisha vifaa na kuuza. Una tatizo gani?',
      'Marahaba! Karibu kwenye huduma zetu. Tunaweza kukusaidia na tatizo lolote la vifaa.'
    ],
    0.9
  );

  // Example: Add specific device types
  await addTrainingData(
    'device_specific',
    ['iphone', 'samsung', 'huawei', 'xiaomi', 'nokia', 'motorola'],
    [
      'Tuna huduma za kurekebisha simu zote: iPhone, Samsung, Huawei, Xiaomi, Nokia, Motorola na nyingine. Mtaalamu wetu atakusaidia haraka. Unaweza kuja ofisini au tutumie technician kwenu.',
      'Tuna huduma za kurekebisha simu zote: iPhone, Samsung, Huawei, Xiaomi, Nokia, Motorola na nyingine. Tafadhali tuambie tatizo lako kwa undani zaidi.'
    ],
    0.8
  );

  console.log('✅ Custom training data added!');
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🤖 AI Training Manager for WhatsApp Customer Service\n');

  switch (command) {
    case 'test':
      testAIResponses();
      break;
    
    case 'show':
      showTrainingData();
      break;
    
    case 'add-custom':
      await addCustomTraining();
      break;
    
    case 'analyze':
      const message = args[1];
      if (!message) {
        console.log('❌ Please provide a message to analyze');
        console.log('Usage: node ai-training-manager.js analyze "your message"');
        return;
      }
      const analysis = analyzeMessageWithEnhancedAI(message, 'test');
      console.log(`📝 Message: "${message}"`);
      console.log(`   Category: ${analysis.category}`);
      console.log(`   Confidence: ${analysis.confidence}`);
      console.log(`   Should Reply: ${analysis.shouldReply}`);
      console.log(`   Response: ${analysis.replyMessage}`);
      console.log(`   Matched Patterns: ${analysis.matchedPatterns.join(', ')}`);
      break;
    
    default:
      console.log('🤖 AI Training Manager Commands:');
      console.log('  test          - Test AI responses with sample messages');
      console.log('  show          - Show current training data');
      console.log('  add-custom    - Add custom training data');
      console.log('  analyze <msg> - Analyze a specific message');
      console.log('');
      console.log('Examples:');
      console.log('  node ai-training-manager.js test');
      console.log('  node ai-training-manager.js show');
      console.log('  node ai-training-manager.js analyze "My phone is broken"');
      break;
  }
}

// Run the script
main().catch(console.error);
