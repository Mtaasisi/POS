#!/usr/bin/env node

/**
 * Fix Duplicate General Settings Script
 * This script removes duplicate general settings records and keeps only the most recent one
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateSettings() {
  try {
    console.log('🔍 Checking for duplicate general settings...');
    
    // Get all general settings records
    const { data: allSettings, error: fetchError } = await supabase
      .from('lats_pos_general_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching settings:', fetchError);
      return;
    }

    if (!allSettings || allSettings.length <= 1) {
      console.log('✅ No duplicate settings found');
      return;
    }

    console.log(`📊 Found ${allSettings.length} general settings records`);

    // Group by user_id
    const userGroups = allSettings.reduce((groups, setting) => {
      const userId = setting.user_id;
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push(setting);
      return groups;
    }, {});

    let totalDeleted = 0;

    // Process each user's settings
    for (const [userId, userSettings] of Object.entries(userGroups)) {
      if (userSettings.length > 1) {
        console.log(`👤 User ${userId}: Found ${userSettings.length} duplicate records`);
        
        // Keep the most recent one (first in the array since we ordered by created_at desc)
        const keepRecord = userSettings[0];
        const deleteRecords = userSettings.slice(1);
        
        console.log(`✅ Keeping record: ${keepRecord.id} (created: ${keepRecord.created_at})`);
        
        // Delete the older duplicates
        for (const record of deleteRecords) {
          console.log(`🗑️ Deleting duplicate: ${record.id} (created: ${record.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('lats_pos_general_settings')
            .delete()
            .eq('id', record.id);

          if (deleteError) {
            console.error(`❌ Error deleting record ${record.id}:`, deleteError);
          } else {
            totalDeleted++;
          }
        }
      }
    }

    console.log(`🎉 Cleanup complete! Deleted ${totalDeleted} duplicate records`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixDuplicateSettings();
