#!/usr/bin/env node

/**
 * Cleanup script for duplicate POS settings records
 * This script removes duplicate records and keeps only the most recent one for each user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to clean up
const POS_SETTINGS_TABLES = [
  'lats_pos_barcode_scanner_settings',
  'lats_pos_search_filter_settings', 
  'lats_pos_loyalty_customer_settings',
  'lats_pos_analytics_reporting_settings',
  'lats_pos_notification_settings'
];

async function cleanupDuplicates() {
  console.log('🧹 Starting cleanup of duplicate POS settings records...\n');

  for (const table of POS_SETTINGS_TABLES) {
    try {
      console.log(`📋 Processing table: ${table}`);
      
      // Get all records grouped by user_id
      const { data: allRecords, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(`❌ Error fetching records from ${table}:`, fetchError);
        continue;
      }

      if (!allRecords || allRecords.length === 0) {
        console.log(`✅ No records found in ${table}`);
        continue;
      }

      // Group records by user_id
      const recordsByUser = {};
      allRecords.forEach(record => {
        if (!recordsByUser[record.user_id]) {
          recordsByUser[record.user_id] = [];
        }
        recordsByUser[record.user_id].push(record);
      });

      let totalDuplicates = 0;
      const recordsToDelete = [];

      // Find duplicates for each user
      Object.entries(recordsByUser).forEach(([userId, userRecords]) => {
        if (userRecords.length > 1) {
          console.log(`👤 User ${userId} has ${userRecords.length} records in ${table}`);
          
          // Keep the most recent record (first in array since we ordered by created_at desc)
          const keepRecord = userRecords[0];
          const deleteRecords = userRecords.slice(1);
          
          console.log(`   ✅ Keeping record ID: ${keepRecord.id} (created: ${keepRecord.created_at})`);
          
          deleteRecords.forEach(record => {
            console.log(`   🗑️ Marking for deletion: ID ${record.id} (created: ${record.created_at})`);
            recordsToDelete.push(record.id);
            totalDuplicates++;
          });
        }
      });

      // Delete duplicate records
      if (recordsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${recordsToDelete.length} duplicate records from ${table}...`);
        
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', recordsToDelete);

        if (deleteError) {
          console.error(`❌ Error deleting duplicates from ${table}:`, deleteError);
        } else {
          console.log(`✅ Successfully deleted ${recordsToDelete.length} duplicate records from ${table}`);
        }
      } else {
        console.log(`✅ No duplicates found in ${table}`);
      }

      console.log(''); // Empty line for readability

    } catch (error) {
      console.error(`💥 Exception processing ${table}:`, error);
    }
  }

  console.log('🎉 Cleanup completed!');
}

// Run the cleanup
cleanupDuplicates()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
