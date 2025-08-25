#!/usr/bin/env node

console.log('🔧 RLS Policy Fix Instructions\n');

console.log('📋 The shelf creation issue is caused by Row Level Security (RLS) policies.');
console.log('Here\'s how to fix it:\n');

console.log('1. 🔐 Go to your Supabase Dashboard');
console.log('   URL: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc');
console.log('');

console.log('2. 📊 Navigate to Authentication > Policies');
console.log('   - Click on "Authentication" in the left sidebar');
console.log('   - Click on "Policies" tab');
console.log('');

console.log('3. 🗂️  Find the following tables and add INSERT policies:');
console.log('   - lats_store_locations');
console.log('   - lats_storage_rooms');
console.log('   - lats_store_shelves');
console.log('');

console.log('4. ➕ For each table, add a policy like this:');
console.log('   Policy Name: "Allow authenticated users to insert"');
console.log('   Target Roles: authenticated');
console.log('   Using expression: auth.role() = \'authenticated\'');
console.log('   Operation: INSERT');
console.log('');

console.log('5. 🔄 Alternative: Temporarily disable RLS');
console.log('   - Go to Database > Tables');
console.log('   - Find each table');
console.log('   - Click the toggle to disable RLS temporarily');
console.log('');

console.log('6. 🏪 After fixing RLS, create the required data:');
console.log('   - Create at least one store location');
console.log('   - Create at least one storage room');
console.log('   - Then test shelf creation');
console.log('');

console.log('7. 🧪 Test the shelf creation:');
console.log('   - Go to Storage Room Management in your app');
console.log('   - Click "Manage Shelves" on a storage room');
console.log('   - Click "Add Shelf" to create new shelves');
console.log('');

console.log('💡 The code fixes I made should now work once the RLS policies are fixed!');
console.log('');

console.log('📞 If you need help with the Supabase dashboard, let me know!');
