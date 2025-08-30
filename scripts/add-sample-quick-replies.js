import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleQuickReplies() {
  console.log('📝 Adding sample quick replies for current user...');

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated. Please log in first.');
      console.log('💡 Run this script after logging into the app.');
      return;
    }

    console.log(`👤 Current user: ${user.email} (${user.id})`);

    // Sample quick replies
    const sampleReplies = [
      {
        text: 'Hello! How can I help you today?',
        category: 'Greetings',
        sort_order: 1
      },
      {
        text: 'Thank you for your message. I\'ll get back to you soon.',
        category: 'Responses',
        sort_order: 1
      },
      {
        text: 'Your order is being processed.',
        category: 'Orders',
        sort_order: 1
      },
      {
        text: 'We\'re experiencing high volume. Please be patient.',
        category: 'Status',
        sort_order: 1
      },
      {
        text: 'Is there anything else I can help you with?',
        category: 'Responses',
        sort_order: 2
      },
      {
        text: 'Your request has been received and is being handled.',
        category: 'Status',
        sort_order: 2
      }
    ];

    // Insert sample replies
    const { data, error } = await supabase
      .from('quick_replies')
      .insert(sampleReplies.map(reply => ({
        ...reply,
        user_id: user.id
      })))
      .select();

    if (error) {
      console.error('❌ Error adding sample quick replies:', error);
      return;
    }

    console.log(`✅ Successfully added ${data.length} sample quick replies`);
    console.log('\n📋 Added quick replies:');
    data.forEach((reply, index) => {
      console.log(`   ${index + 1}. [${reply.category}] ${reply.text}`);
    });

    console.log('\n🎉 Sample quick replies are now available in your WhatsApp chat!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addSampleQuickReplies().catch(console.error);
