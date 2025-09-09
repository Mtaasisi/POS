// Script to check and create missing shipping tables
import { supabase } from '../src/lib/supabaseClient.ts';

async function checkAndCreateShippingTables() {
  console.log('🔍 Checking shipping tables...\n');

  try {
    // Step 1: Check what shipping tables exist
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'lats_shipping%'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      return;
    }

    console.log('📊 Existing shipping tables:');
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    } else {
      console.log('  ❌ No shipping tables found');
    }

    // Step 2: Check if lats_shipping_info exists
    const hasShippingInfo = tables && tables.some(t => t.table_name === 'lats_shipping_info');
    
    if (!hasShippingInfo) {
      console.log('\n🔧 Creating missing shipping tables...');
      
      // Create shipping carriers table
      const { error: carriersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_carriers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE,
            logo TEXT,
            tracking_url TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            supported_services JSONB DEFAULT '[]',
            contact_info JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (carriersError) {
        console.log('❌ Error creating carriers table:', carriersError.message);
      } else {
        console.log('✅ Created lats_shipping_carriers table');
      }

      // Create shipping managers table
      const { error: managersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_managers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            department TEXT DEFAULT 'Logistics',
            is_active BOOLEAN DEFAULT true,
            avatar TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (managersError) {
        console.log('❌ Error creating managers table:', managersError.message);
      } else {
        console.log('✅ Created lats_shipping_managers table');
      }

      // Create shipping agents table
      const { error: agentsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_agents (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            company TEXT,
            is_active BOOLEAN DEFAULT true,
            avatar TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (agentsError) {
        console.log('❌ Error creating agents table:', agentsError.message);
      } else {
        console.log('✅ Created lats_shipping_agents table');
      }

      // Create shipping info table
      const { error: shippingInfoError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_info (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
            carrier_id UUID REFERENCES lats_shipping_carriers(id) ON DELETE SET NULL,
            agent_id UUID REFERENCES lats_shipping_agents(id) ON DELETE SET NULL,
            manager_id UUID REFERENCES lats_shipping_managers(id) ON DELETE SET NULL,
            tracking_number TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
            estimated_delivery DATE,
            actual_delivery TIMESTAMP WITH TIME ZONE,
            cost DECIMAL(10,2) DEFAULT 0,
            require_signature BOOLEAN DEFAULT false,
            enable_insurance BOOLEAN DEFAULT false,
            insurance_value DECIMAL(10,2) DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (shippingInfoError) {
        console.log('❌ Error creating shipping_info table:', shippingInfoError.message);
      } else {
        console.log('✅ Created lats_shipping_info table');
      }

      // Create shipping events table
      const { error: eventsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_events (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            shipping_id UUID NOT NULL REFERENCES lats_shipping_info(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            notes TEXT,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            is_automated BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (eventsError) {
        console.log('❌ Error creating events table:', eventsError.message);
      } else {
        console.log('✅ Created lats_shipping_events table');
      }

      // Create shipping settings table
      const { error: settingsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_shipping_settings (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            auto_assign_agents BOOLEAN DEFAULT true,
            default_carrier_id UUID REFERENCES lats_shipping_carriers(id) ON DELETE SET NULL,
            enable_tracking BOOLEAN DEFAULT true,
            enable_notifications BOOLEAN DEFAULT true,
            notification_channels JSONB DEFAULT '["email", "sms"]',
            tracking_update_interval INTEGER DEFAULT 60,
            default_shipping_cost DECIMAL(10,2) DEFAULT 0,
            auto_update_status BOOLEAN DEFAULT true,
            require_signature BOOLEAN DEFAULT false,
            enable_insurance BOOLEAN DEFAULT false,
            max_shipping_cost DECIMAL(10,2) DEFAULT 50000,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (settingsError) {
        console.log('❌ Error creating settings table:', settingsError.message);
      } else {
        console.log('✅ Created lats_shipping_settings table');
      }

      // Insert default carriers
      const { error: insertCarriersError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO lats_shipping_carriers (name, code, tracking_url, supported_services, contact_info) VALUES
          ('DHL Tanzania', 'DHL', 'https://www.dhl.com/tz-en/home/tracking.html?tracking-id={tracking_number}', 
           '["express", "standard", "overnight"]', '{"phone": "+255 22 211 0000", "email": "info@dhl.co.tz"}'),
          ('TNT Tanzania', 'TNT', 'https://www.tnt.com/express/en_tz/site/shipping-tools/track.html?searchType=con&cons={tracking_number}', 
           '["express", "standard"]', '{"phone": "+255 22 211 0000", "email": "info@tnt.co.tz"}'),
          ('Posta Tanzania', 'POSTA', 'https://www.posta.co.tz/track/{tracking_number}', 
           '["standard", "registered"]', '{"phone": "+255 22 211 0000", "email": "info@posta.co.tz"}'),
          ('FedEx Tanzania', 'FEDEX', 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}', 
           '["express", "overnight"]', '{"phone": "+255 22 211 0000", "email": "info@fedex.co.tz"}'),
          ('Local Courier', 'LOCAL', 'https://www.google.com/search?q=local+courier+tracking+{tracking_number}', 
           '["standard", "express"]', '{"phone": "+255 123 456 789", "email": "info@localcourier.co.tz"}')
          ON CONFLICT (code) DO NOTHING;
        `
      });

      if (insertCarriersError) {
        console.log('❌ Error inserting default carriers:', insertCarriersError.message);
      } else {
        console.log('✅ Inserted default carriers');
      }

      // Insert default managers
      const { error: insertManagersError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO lats_shipping_managers (name, email, phone, department) VALUES
          ('Manager', 'manager@shipping.com', '+255 123 456 789', 'Logistics'),
          ('Logistics Manager', 'logistics@shipping.com', '+255 987 654 321', 'Logistics')
          ON CONFLICT DO NOTHING;
        `
      });

      if (insertManagersError) {
        console.log('❌ Error inserting default managers:', insertManagersError.message);
      } else {
        console.log('✅ Inserted default managers');
      }

      // Insert default agents
      const { error: insertAgentsError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO lats_shipping_agents (name, email, phone, company) VALUES
          ('Manager', 'manager@shipping.com', '+255 123 456 789', 'Shipping Company'),
          ('Shipping Agent', 'agent@shipping.com', '+255 987 654 321', 'Shipping Company')
          ON CONFLICT DO NOTHING;
        `
      });

      if (insertAgentsError) {
        console.log('❌ Error inserting default agents:', insertAgentsError.message);
      } else {
        console.log('✅ Inserted default agents');
      }

      console.log('\n🎉 All shipping tables created successfully!');
    } else {
      console.log('\n✅ All shipping tables already exist');
    }

    // Step 3: Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const { data: finalTables, error: finalError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'lats_shipping%'
        ORDER BY table_name;
      `
    });

    if (finalError) {
      console.log('❌ Error verifying tables:', finalError.message);
    } else {
      console.log('📊 Final shipping tables:');
      finalTables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAndCreateShippingTables();
