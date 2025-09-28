import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Creating diagnostic problem templates...');

async function createTemplates() {
  try {
    // First, try to insert some default templates
    const defaultTemplates = [
      {
        problem_name: 'Phone No Power',
        problem_description: 'Device does not turn on or show any signs of life.',
        category: 'power',
        checklist_items: [
          {
            id: '1',
            title: 'Check Power Button',
            description: 'Verify if the power button is physically working and responsive.',
            required: true
          },
          {
            id: '2', 
            title: 'Check Charging Port',
            description: 'Inspect charging port for debris, damage, or loose connection. Test with known good charger.',
            required: true
          },
          {
            id: '3',
            title: 'Test with Known Good Battery', 
            description: 'If possible, test with a known good battery to rule out battery failure.',
            required: true
          },
          {
            id: '4',
            title: 'Check for Water Damage Indicators',
            description: 'Inspect LCI (Liquid Contact Indicators) and internal components for signs of water damage.',
            required: true
          },
          {
            id: '5',
            title: 'Perform Hard Reset/Force Restart',
            description: 'Attempt a hard reset or force restart sequence for the specific device model.',
            required: true
          }
        ],
        is_active: true,
        created_by: null
      },
      {
        problem_name: 'Screen Issues',
        problem_description: 'Display problems including cracked screen, no display, or touch issues.',
        category: 'display',
        checklist_items: [
          {
            id: '1',
            title: 'Visual Inspection',
            description: 'Check for physical damage, cracks, or discoloration on the screen.',
            required: true
          },
          {
            id: '2',
            title: 'Test Touch Functionality',
            description: 'Test touch response across different areas of the screen.',
            required: true
          },
          {
            id: '3',
            title: 'Check Display Connection',
            description: 'Inspect internal display cable connections if accessible.',
            required: false
          },
          {
            id: '4',
            title: 'Test with External Display',
            description: 'If possible, test with external display to isolate screen vs. device issues.',
            required: false
          }
        ],
        is_active: true,
        created_by: null
      },
      {
        problem_name: 'Audio Problems',
        problem_description: 'Speaker, microphone, or headphone jack issues.',
        category: 'audio',
        checklist_items: [
          {
            id: '1',
            title: 'Test Speaker Output',
            description: 'Play audio through device speakers and check for distortion or no sound.',
            required: true
          },
          {
            id: '2',
            title: 'Test Microphone',
            description: 'Record audio or make a test call to verify microphone functionality.',
            required: true
          },
          {
            id: '3',
            title: 'Check Headphone Jack',
            description: 'Test with known good headphones to verify jack functionality.',
            required: true
          },
          {
            id: '4',
            title: 'Check Audio Settings',
            description: 'Verify audio settings and volume levels are properly configured.',
            required: true
          }
        ],
        is_active: true
      }
    ];

    console.log('📋 Inserting default templates...');
    const { data, error } = await supabase
      .from('diagnostic_problem_templates')
      .upsert(defaultTemplates, { onConflict: 'problem_name' });

    if (error) {
      console.error('❌ Error inserting templates:', error);
      
      // If table doesn't exist, let's try to create it first
      if (error.code === 'PGRST116') {
        console.log('📋 Table does not exist, creating it first...');
        
        // Try to create the table using a simple approach
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS diagnostic_problem_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            problem_name TEXT NOT NULL UNIQUE,
            problem_description TEXT,
            category TEXT NOT NULL DEFAULT 'general',
            checklist_items JSONB NOT NULL DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        // This might not work, but let's try
        console.log('⚠️  Please create the table manually using the SQL file, then run this script again.');
        console.log('📄 SQL to create table:');
        console.log(createTableSQL);
      }
    } else {
      console.log('✅ Templates created successfully!');
      console.log('📊 Created templates:');
      data?.forEach(template => {
        console.log(`   - ${template.problem_name} (${template.category})`);
      });
    }
    
    // Verify the templates exist
    const { data: templates, error: selectError } = await supabase
      .from('diagnostic_problem_templates')
      .select('id, problem_name, category')
      .limit(10);
    
    if (selectError) {
      console.error('❌ Error verifying templates:', selectError);
    } else {
      console.log('✅ Verification successful!');
      console.log('📊 Available templates:');
      templates?.forEach(template => {
        console.log(`   - ${template.problem_name} (${template.category})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

createTemplates();
