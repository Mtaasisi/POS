const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Running diagnostic problem templates migration...');

async function runMigration() {
  try {
    // Create diagnostic_problem_templates table
    console.log('📋 Creating diagnostic_problem_templates table...');
    const { error: templatesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS diagnostic_problem_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          problem_name TEXT NOT NULL UNIQUE,
          problem_description TEXT,
          category TEXT NOT NULL DEFAULT 'general',
          checklist_items JSONB NOT NULL DEFAULT '[]',
          is_active BOOLEAN DEFAULT TRUE,
          created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (templatesError) {
      console.error('❌ Error creating templates table:', templatesError);
    } else {
      console.log('✅ Templates table created successfully');
    }

    // Create diagnostic_checklist_results table
    console.log('📋 Creating diagnostic_checklist_results table...');
    const { error: resultsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS diagnostic_checklist_results (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
          template_id UUID NOT NULL REFERENCES diagnostic_problem_templates(id) ON DELETE CASCADE,
          technician_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
          overall_status TEXT NOT NULL CHECK (overall_status IN ('pending', 'in_progress', 'completed', 'failed')),
          technician_notes TEXT,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (resultsError) {
      console.error('❌ Error creating results table:', resultsError);
    } else {
      console.log('✅ Results table created successfully');
    }

    // Insert default problem templates
    console.log('📋 Inserting default problem templates...');
    const { error: insertError } = await supabase
      .from('diagnostic_problem_templates')
      .upsert([
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          problem_name: 'Phone No Power',
          category: 'Power Issues',
          problem_description: 'Device does not turn on or show any signs of life.',
          checklist_items: [
            {
              id: '1',
              title: 'Check Power Button',
              description: 'Verify if the power button is physically working and responsive.',
              required: true,
              order_index: 1
            },
            {
              id: '2',
              title: 'Check Charging Port',
              description: 'Inspect charging port for debris, damage, or loose connection. Test with known good charger.',
              required: true,
              order_index: 2
            },
            {
              id: '3',
              title: 'Test with Known Good Battery',
              description: 'If possible, test with a known good battery to rule out battery failure.',
              required: true,
              order_index: 3
            },
            {
              id: '4',
              title: 'Check for Water Damage Indicators',
              description: 'Inspect LCI (Liquid Contact Indicators) and internal components for signs of water damage.',
              required: true,
              order_index: 4
            },
            {
              id: '5',
              title: 'Perform Hard Reset/Force Restart',
              description: 'Attempt a hard reset or force restart sequence for the specific device model.',
              required: true,
              order_index: 5
            },
            {
              id: '6',
              title: 'Check Motherboard for Visible Damage',
              description: 'Visually inspect motherboard for burnt components, corrosion, or physical damage.',
              required: false,
              order_index: 6
            }
          ],
          is_active: true
        },
        {
          id: 'b1fccb00-0d1c-4e0f-8a7b-7bb9bd380a12',
          problem_name: 'Screen Issues',
          category: 'Display Problems',
          problem_description: 'Screen is cracked, not responding to touch, or has display anomalies.',
          checklist_items: [
            {
              id: '1',
              title: 'Inspect Physical Screen Damage',
              description: 'Check for cracks, deep scratches, or pressure marks on the display.',
              required: true,
              order_index: 1
            },
            {
              id: '2',
              title: 'Test Touch Responsiveness',
              description: 'Perform a touch screen test across the entire display area.',
              required: true,
              order_index: 2
            },
            {
              id: '3',
              title: 'Check Display Quality',
              description: 'Look for dead pixels, discoloration, flickering, or lines on the screen.',
              required: true,
              order_index: 3
            },
            {
              id: '4',
              title: 'Verify Backlight Functionality',
              description: 'Ensure backlight is working correctly and brightness adjusts.',
              required: true,
              order_index: 4
            },
            {
              id: '5',
              title: 'Inspect Screen Connector',
              description: 'Check internal screen flex cable and connector for damage or improper seating.',
              required: false,
              order_index: 5
            }
          ],
          is_active: true
        }
      ], { onConflict: 'id' });

    if (insertError) {
      console.error('❌ Error inserting templates:', insertError);
    } else {
      console.log('✅ Default templates inserted successfully');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Diagnostic problem templates and checklist system is now ready');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runMigration();
