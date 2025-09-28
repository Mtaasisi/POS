# How to Fix Missing Tables (404 Errors)

The 404 errors you're seeing are because several database tables are missing from your Supabase database. Here's how to fix them:

## Method 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the migration SQL**
   - Open the file `fix-missing-tables-migration.sql` in this directory
   - Copy the entire contents
   - Paste it into the SQL editor

4. **Run the migration**
   - Click "Run" to execute the SQL
   - Wait for it to complete (should take a few seconds)

5. **Verify the fix**
   - The migration includes verification messages
   - You should see "✅ All missing tables created successfully!" at the end

## Method 2: Using the Node.js Script

If you prefer to run it programmatically:

1. **Install dependencies** (if not already installed):
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

2. **Make sure your .env file has the required variables**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run the script**:
   ```bash
   node run-missing-tables-fix.js
   ```

## What This Migration Creates

The migration creates these missing tables and views:

- `stock_movements` - For inventory stock tracking
- `sms_logs` - For SMS message logging  
- `uuid_diagnostic_log` - For device diagnostic results
- `whatsapp_instances` - For WhatsApp instance configuration
- `whatsapp_templates` - For WhatsApp message templates
- `whatsapp_instance_settings_view` - View for WhatsApp settings

## Expected Results

After running the migration:

1. ✅ The 404 errors in your console should disappear
2. ✅ Your Analytics tab should load without errors
3. ✅ Product detail pages should work properly
4. ✅ SMS and WhatsApp features should be accessible

## Troubleshooting

If you still see errors after running the migration:

1. **Check the Supabase logs** for any error messages
2. **Verify table permissions** - make sure RLS policies are working
3. **Clear your browser cache** and refresh the page
4. **Check your environment variables** are correct

## Need Help?

If you encounter any issues:
1. Check the Supabase SQL editor for error messages
2. Verify your database connection is working
3. Make sure you have admin access to your Supabase project
