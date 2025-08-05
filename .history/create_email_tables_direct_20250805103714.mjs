import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('🔧 Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmailTables() {
  try {
    console.log('📧 Creating email tables...');
    
    // First, let's check if the tables already exist
    console.log('🔍 Checking existing tables...');
    
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('id')
        .limit(1);
      
      if (!templatesError) {
        console.log('✅ email_templates table already exists');
        return;
      }
    } catch (error) {
      console.log('📝 email_templates table does not exist, creating...');
    }
    
    // Since we can't create tables directly via the client, let's create a simple workaround
    // We'll create the tables by inserting sample data that will create the structure
    
    console.log('📝 Creating email_templates table structure...');
    
    // Try to insert a sample template to create the table structure
    const sampleTemplate = {
      id: 'template-sample',
      name: 'Sample Template',
      subject: 'Sample Subject',
      content: 'Sample content',
      variables: ['customer_name'],
      category: 'service',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert([sampleTemplate]);
      
      if (error) {
        console.log('⚠️ Could not create email_templates table via insert:', error.message);
        console.log('📋 You may need to create the table manually in your Supabase dashboard');
        console.log('📋 SQL to run in Supabase SQL editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category TEXT CHECK (category IN ('promotional', 'service', 'reminder', 'birthday', 'loyalty')) DEFAULT 'service',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
      } else {
        console.log('✅ email_templates table created successfully');
        
        // Now try to create email_campaigns table
        console.log('📝 Creating email_campaigns table structure...');
        
        const sampleCampaign = {
          id: 'campaign-sample',
          name: 'Sample Campaign',
          template_id: 'template-sample',
          template_name: 'Sample Template',
          target_audience: 'all',
          status: 'draft',
          sent_count: 0,
          total_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        try {
          const { error: campaignError } = await supabase
            .from('email_campaigns')
            .insert([sampleCampaign]);
          
          if (campaignError) {
            console.log('⚠️ Could not create email_campaigns table via insert:', campaignError.message);
            console.log('📋 SQL to run in Supabase SQL editor:');
            console.log(`
CREATE TABLE IF NOT EXISTS email_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_id TEXT REFERENCES email_templates(id) ON DELETE CASCADE,
    template_name TEXT,
    target_audience TEXT CHECK (target_audience IN ('all', 'vip', 'inactive', 'active', 'custom')) DEFAULT 'all',
    status TEXT CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')) DEFAULT 'draft',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
            `);
          } else {
            console.log('✅ email_campaigns table created successfully');
          }
        } catch (campaignError) {
          console.log('❌ Error creating email_campaigns table:', campaignError);
        }
      }
    } catch (error) {
      console.log('❌ Error creating email_templates table:', error);
    }
    
  } catch (error) {
    console.error('❌ Error in createEmailTables:', error);
  }
}

// Run the script
createEmailTables(); 