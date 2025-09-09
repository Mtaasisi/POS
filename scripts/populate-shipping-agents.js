// JavaScript script to populate shipping agents data
// Run this in your browser console on the app page

const shippingAgentsData = [
  {
    name: 'DHL Express Tanzania',
    company: 'DHL Express',
    phone: '+255 22 211 0000',
    whatsapp: '+255 22 211 0000',
    is_active: true,
    supported_shipping_types: ['air', 'express', 'international'],
    address: 'DHL House, Nyerere Road',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    service_areas: ['domestic', 'international', 'regional'],
    specializations: ['electronics', 'documents', 'express', 'fragile'],
    price_per_cbm: 150.00,
    price_per_kg: 8.50,
    average_delivery_time: '1-3 days',
    notes: 'Premium express shipping service',
    rating: 4.8,
    total_shipments: 1250
  },
  {
    name: 'FedEx Tanzania',
    company: 'FedEx Corporation',
    phone: '+255 22 213 4567',
    whatsapp: '+255 22 213 4567',
    is_active: true,
    supported_shipping_types: ['air', 'express', 'international'],
    address: 'FedEx Office, Samora Avenue',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    service_areas: ['domestic', 'international', 'regional'],
    specializations: ['electronics', 'documents', 'express', 'medical'],
    price_per_cbm: 145.00,
    price_per_kg: 8.00,
    average_delivery_time: '1-2 days',
    notes: 'Reliable express delivery service',
    rating: 4.7,
    total_shipments: 980
  },
  {
    name: 'UPS Tanzania',
    company: 'United Parcel Service',
    phone: '+255 22 215 7890',
    whatsapp: '+255 22 215 7890',
    is_active: true,
    supported_shipping_types: ['air', 'ground', 'international'],
    address: 'UPS Center, Bagamoyo Road',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    service_areas: ['domestic', 'international', 'regional'],
    specializations: ['electronics', 'bulk', 'ground', 'express'],
    price_per_cbm: 140.00,
    price_per_kg: 7.50,
    average_delivery_time: '2-4 days',
    notes: 'Comprehensive shipping solutions',
    rating: 4.6,
    total_shipments: 850
  },
  {
    name: 'Maersk Line Tanzania',
    company: 'Maersk Line',
    phone: '+255 22 219 5678',
    whatsapp: '+255 22 219 5678',
    is_active: true,
    supported_shipping_types: ['sea', 'container', 'bulk'],
    address: 'Maersk House, Ocean Road',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    service_areas: ['international', 'regional'],
    specializations: ['bulk', 'container', 'heavy', 'industrial'],
    price_per_cbm: 85.00,
    price_per_kg: 4.50,
    average_delivery_time: '14-21 days',
    notes: 'Ocean freight and container shipping',
    rating: 4.4,
    total_shipments: 450
  },
  {
    name: 'Tanzania Express Delivery',
    company: 'TED Services',
    phone: '+255 22 225 7890',
    whatsapp: '+255 22 225 7890',
    is_active: true,
    supported_shipping_types: ['local', 'ground', 'express'],
    address: 'TED Center, Uhuru Street',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    service_areas: ['domestic'],
    specializations: ['local', 'express', 'documents', 'small_packages'],
    price_per_cbm: 25.00,
    price_per_kg: 2.50,
    average_delivery_time: 'Same day',
    notes: 'Local express delivery service',
    rating: 4.6,
    total_shipments: 2100
  }
];

async function populateShippingAgents() {
  console.log('🚢 Starting to populate shipping agents...');
  
  try {
    // Check if supabase is available
    if (typeof window === 'undefined' || !window.supabase) {
      console.error('❌ Supabase client not found');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const agentData of shippingAgentsData) {
      try {
        console.log(`📦 Creating shipping agent: ${agentData.name}`);
        
        const { data, error } = await window.supabase
          .from('lats_shipping_agents')
          .insert([agentData])
          .select();

        if (error) {
          console.error(`❌ Error creating ${agentData.name}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Created ${agentData.name}:`, data[0]);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception creating ${agentData.name}:`, err);
        errorCount++;
      }
    }

    console.log(`🎉 Population complete! Success: ${successCount}, Errors: ${errorCount}`);

    // Verify the data
    const { data: allAgents, error: fetchError } = await window.supabase
      .from('lats_shipping_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching created agents:', fetchError);
    } else {
      console.log('📊 All shipping agents:', allAgents);
    }

  } catch (error) {
    console.error('❌ Exception during population:', error);
  }
}

// Run the population
populateShippingAgents();
