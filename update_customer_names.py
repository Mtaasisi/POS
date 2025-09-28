#!/usr/bin/env python3
"""
Update Customer Names - Replace generic names with actual names from transaction data
"""
import json
import csv
from collections import defaultdict

def load_transaction_data():
    """Load comprehensive transaction data with real names"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Transaction data file not found.")
        return None

def load_customer_data():
    """Load current customer data from CSV"""
    customers = []
    try:
        with open('customer_database_updates_fixed.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                customers.append(row)
        return customers
    except FileNotFoundError:
        print("Customer data file not found.")
        return None

def create_name_mapping(transaction_data):
    """Create mapping from phone numbers to real names"""
    name_mapping = {}
    
    for phone, data in transaction_data.items():
        if data.get('name') and data['name'] != 'Unknown':
            # Use the name from transaction data
            name_mapping[phone] = data['name']
    
    return name_mapping

def update_customer_names(customers, name_mapping):
    """Update customer names with real names from transaction data"""
    updated_customers = []
    updated_count = 0
    
    for customer in customers:
        phone = customer['phone']
        current_name = customer['name']
        
        # Check if we have a real name for this phone number
        if phone in name_mapping:
            real_name = name_mapping[phone]
            if real_name != current_name:
                customer['name'] = real_name
                updated_count += 1
                print(f"Updated: {current_name} → {real_name} ({phone})")
        
        updated_customers.append(customer)
    
    return updated_customers, updated_count

def show_name_updates(customers, name_mapping):
    """Show which names will be updated"""
    print("🔄 CUSTOMER NAME UPDATES")
    print("=" * 40)
    print()
    
    updates = []
    for customer in customers:
        phone = customer['phone']
        current_name = customer['name']
        
        if phone in name_mapping:
            real_name = name_mapping[phone]
            if real_name != current_name:
                updates.append({
                    'phone': phone,
                    'old_name': current_name,
                    'new_name': real_name,
                    'loyalty_level': customer['loyalty_level'],
                    'total_spent': customer['total_spent']
                })
    
    print(f"Found {len(updates)} customers with name updates:")
    print()
    
    for i, update in enumerate(updates[:20], 1):  # Show first 20
        print(f"{i:2d}. {update['old_name']} → {update['new_name']}")
        print(f"     📞 {update['phone']}")
        print(f"     🏷️  {update['loyalty_level'].upper()}")
        print(f"     💰 TSh {int(update['total_spent']):,}")
        print()
    
    if len(updates) > 20:
        print(f"... and {len(updates) - 20} more customers")
    
    return updates

def export_updated_customers(updated_customers):
    """Export customers with updated names"""
    print("📝 EXPORTING UPDATED CUSTOMERS")
    print("=" * 35)
    
    # Export updated CSV
    with open('customer_database_updates_with_real_names.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'name', 'phone', 'email', 'whatsapp', 'gender', 'city',
            'color_tag', 'loyalty_level', 'total_spent', 'points', 'total_purchases',
            'last_visit', 'last_purchase_date', 'created_at', 'referral_source',
            'customer_tag', 'is_active'
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for customer in updated_customers:
            writer.writerow(customer)
    
    print("✅ Updated customer data exported to:")
    print("   - customer_database_updates_with_real_names.csv")
    
    return updated_customers

def generate_updated_sql(updated_customers):
    """Generate SQL with updated names"""
    print("🔧 GENERATING UPDATED SQL")
    print("=" * 30)
    
    sql_content = """-- Customer Database Updates with Real Names from SMS Transaction Data
-- Generated automatically from transaction analysis

-- Ensure all required columns exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new' CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased', 'normal'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_tag TEXT;

"""
    
    for customer in updated_customers:
        # Check if customer exists
        check_sql = f"""
-- Check if customer exists: {customer['name']} ({customer['phone']})
SELECT id FROM customers WHERE phone = '{customer['phone']}';
"""
        
        # Insert/Update customer with real name
        insert_sql = f"""
-- Insert/Update customer: {customer['name']} ({customer['phone']})
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '{customer['id']}',
    '{customer['name'].replace("'", "''")}',
    '{customer['phone']}',
    {f"'{customer['email']}'" if customer['email'] else 'NULL'},
    '{customer['whatsapp']}',
    '{customer['gender']}',
    '{customer['city']}',
    'Auto-imported from SMS transactions. Total transactions: {customer['total_purchases']}',
    {customer['is_active']},
    '{customer['color_tag']}',
    '{customer['loyalty_level']}',
    {customer['total_spent']},
    '{customer['last_visit']}',
    {customer['points']},
    '{customer['referral_source']}',
    {customer['total_purchases']},
    '{customer['last_purchase_date']}',
    '{customer['created_at']}',
    '{customer['updated_at']}',
    '{customer['created_by']}',
    {customer['whatsapp_opt_out']},
    'Customer imported from SMS transaction data. First transaction: {customer['created_at']}',
    '{customer['customer_tag']}'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;
"""
        
        sql_content += check_sql + insert_sql
    
    # Write SQL file
    with open('customer_database_updates_with_real_names.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("✅ Updated SQL file created:")
    print("   - customer_database_updates_with_real_names.sql")

def show_sample_updated_customers(updated_customers):
    """Show sample of customers with updated names"""
    print("🎯 SAMPLE CUSTOMERS WITH REAL NAMES")
    print("=" * 45)
    print()
    
    # Show top customers with real names
    sorted_customers = sorted(updated_customers, key=lambda x: int(x['total_spent']), reverse=True)
    
    for i, customer in enumerate(sorted_customers[:10], 1):
        print(f"{i:2d}. {customer['name']}")
        print(f"     📞 {customer['phone']}")
        print(f"     💰 TSh {int(customer['total_spent']):,}")
        print(f"     🏷️  {customer['loyalty_level'].upper()}")
        print(f"     🎯 {int(customer['points']):,} points")
        print()

def main():
    """Main function"""
    print("🔄 UPDATING CUSTOMER NAMES WITH REAL NAMES")
    print("=" * 55)
    print()
    
    # Load data
    transaction_data = load_transaction_data()
    if not transaction_data:
        return
    
    customers = load_customer_data()
    if not customers:
        return
    
    # Create name mapping
    name_mapping = create_name_mapping(transaction_data)
    print(f"📋 Found {len(name_mapping)} customers with real names in transaction data")
    print()
    
    # Show updates
    updates = show_name_updates(customers, name_mapping)
    
    if not updates:
        print("✅ All customer names are already up to date!")
        return
    
    # Update customers
    updated_customers, updated_count = update_customer_names(customers, name_mapping)
    
    print(f"\n✅ Updated {updated_count} customer names")
    print()
    
    # Export updated data
    export_updated_customers(updated_customers)
    generate_updated_sql(updated_customers)
    
    # Show samples
    show_sample_updated_customers(updated_customers)
    
    print("🎉 CUSTOMER NAME UPDATE COMPLETE!")
    print("=" * 40)
    print()
    print("Files created with real names:")
    print("  • customer_database_updates_with_real_names.csv")
    print("  • customer_database_updates_with_real_names.sql")
    print()
    print("🚀 Use these files to update your customer system with real names!")

if __name__ == "__main__":
    main()
