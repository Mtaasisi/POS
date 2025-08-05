import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const createBrandsTable = async () => {
  try {
    console.log('🔧 Creating brands table...');

    // Create brands table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS brands (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          logo_url TEXT,
          category JSONB DEFAULT '[]'::jsonb,
          categories JSONB DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index on name for faster searches
        CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
        
        -- Create index on is_active for filtering
        CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
        
        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_brands_updated_at 
          BEFORE UPDATE ON brands 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

        -- Enable RLS
        ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Enable read access for all users" ON brands
          FOR SELECT USING (true);

        CREATE POLICY "Enable insert for authenticated users" ON brands
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Enable update for authenticated users" ON brands
          FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Enable delete for authenticated users" ON brands
          FOR DELETE USING (auth.role() = 'authenticated');
      `
    });

    if (createError) {
      console.error('❌ Error creating brands table:', createError);
      return;
    }

    console.log('✅ Brands table created successfully');

    // Insert some sample brands
    const sampleBrands = [
      {
        name: 'Apple',
        description: 'Apple Inc. - Premium electronics manufacturer',
        category: ['phone', 'laptop', 'tablet'],
        is_active: true
      },
      {
        name: 'Samsung',
        description: 'Samsung Electronics - Global technology leader',
        category: ['phone', 'laptop', 'tablet'],
        is_active: true
      },
      {
        name: 'Generic',
        description: 'Generic/Third-party replacement parts',
        category: ['accessories', 'other'],
        is_active: true
      },
      {
        name: 'Dell',
        description: 'Dell Technologies - Computer hardware company',
        category: ['laptop', 'desktop', 'monitor'],
        is_active: true
      },
      {
        name: 'HP',
        description: 'Hewlett-Packard - Technology company',
        category: ['laptop', 'printer', 'desktop'],
        is_active: true
      }
    ];

    console.log('📝 Inserting sample brands...');

    for (const brand of sampleBrands) {
      const { error: insertError } = await supabase
        .from('brands')
        .insert(brand);

      if (insertError) {
        console.error(`❌ Error inserting ${brand.name}:`, insertError);
      } else {
        console.log(`✅ Inserted ${brand.name}`);
      }
    }

    console.log('✅ Brands table setup complete!');

  } catch (error) {
    console.error('❌ Error in setup:', error);
  }
};

createBrandsTable(); 