#!/usr/bin/env node

// Check communication_templates table structure
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking communication_templates table structure...');

async function checkTableStructure() {
    try {
        // Try to get all data to see the structure
        const { data, error } = await supabase
            .from('communication_templates')
            .select('*')
            .limit(5);
        
        if (error) {
            console.log('❌ Error accessing communication_templates:', error.message);
            return;
        }
        
        console.log('✅ communication_templates table exists');
        console.log('📋 Sample data:', data);
        
        if (data && data.length > 0) {
            console.log('📊 Column names from first record:');
            const columns = Object.keys(data[0]);
            columns.forEach(col => console.log(`  - ${col}`));
        } else {
            console.log('📊 Table exists but is empty');
        }
        
    } catch (error) {
        console.log('❌ Exception:', error.message);
    }
}

checkTableStructure(); 