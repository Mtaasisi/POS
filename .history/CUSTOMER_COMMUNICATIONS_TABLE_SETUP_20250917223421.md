# Customer Communications Table Setup

## Problem
You're getting a 404 error when trying to access the `customer_communications` table:
```
POST https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/customer_communications 404 (Not Found)
```

## Solution
The `customer_communications` table doesn't exist in your database. You need to create it manually.

## Manual Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor)
2. Navigate to the SQL Editor

### Step 2: Run the SQL Script
Copy and paste the following SQL into the SQL Editor and execute it:

```sql
-- Create customer_communications table for tracking customer communications
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    
    -- Communication details
    type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'phone_call')),
    message TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
    
    -- Contact information
    phone_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Metadata
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- User tracking
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_device_id ON customer_communications(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
CREATE INDEX IF NOT EXISTS idx_customer_communications_sent_at ON customer_communications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_communications_phone_number ON customer_communications(phone_number);

-- Enable Row Level Security
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own communications" ON customer_communications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        ) OR
        auth.uid() = sent_by
    );

CREATE POLICY "Users can insert communications" ON customer_communications
    FOR INSERT WITH CHECK (
        auth.uid() = sent_by OR
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        )
    );

CREATE POLICY "Users can update their own communications" ON customer_communications
    FOR UPDATE USING (
        auth.uid() = sent_by OR
        auth.uid() IN (
            SELECT user_id FROM customers WHERE id = customer_id
        )
    );
```

### Step 3: Verify the Table
After running the SQL, you can verify the table was created by running this test query:

```sql
SELECT * FROM customer_communications LIMIT 1;
```

## What This Table Does
The `customer_communications` table stores all communication logs between your business and customers, including:
- SMS messages
- WhatsApp messages  
- Email communications
- Phone call logs

## Usage in Your App
Your app uses this table in `DeviceRepairDetailModal.tsx` to log SMS messages sent to customers about device repair status updates.

## Files Created
- `create-customer-communications-table.sql` - The SQL script
- `supabase/migrations/20250131000060_create_customer_communications_table.sql` - Migration file
- `apply-customer-communications-migration.js` - Migration script (requires service role key)
- `create-customer-communications-simple.js` - Simple test script

## Next Steps
1. Run the SQL in your Supabase dashboard
2. Test your app - the 404 error should be resolved
3. The SMS functionality in device repair should now work properly
