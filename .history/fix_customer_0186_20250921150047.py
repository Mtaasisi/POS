#!/usr/bin/env python3
"""
Fix Customer 0186 - Update specific customer data in database
"""
import csv
import json

def get_customer_0186_data():
    """Get the correct data for Customer 0186"""
    try:
        with open('customer_database_updates_fixed.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['phone'] == '25564000186':
                    return row
    except FileNotFoundError:
        print("CSV file not found")
        return None

def generate_customer_0186_sql():
    """Generate SQL to update Customer 0186"""
    customer = get_customer_0186_data()
    if not customer:
        print("Customer 0186 data not found")
        return
    
    print("🔧 CUSTOMER 0186 DATABASE UPDATE")
    print("=" * 40)
    print()
    print("Current data in your system:")
    print("  Name: Customer 0186")
    print("  Total Spent: Tsh 0")
    print("  Points: 0")
    print("  Level: Unknown")
    print()
    print("Correct data from transaction analysis:")
    print(f"  Name: {customer['name']}")
    print(f"  Total Spent: TSh {int(customer['total_spent']):,}")
    print(f"  Points: {int(customer['points']):,}")
    print(f"  Level: {customer['loyalty_level'].upper()}")
    print(f"  Tag: {customer['color_tag'].upper()}")
    print()
    
    # Generate SQL update
    sql_update = f"""
-- Update Customer 0186 with correct transaction data
UPDATE customers SET
    name = '{customer['name']}',
    total_spent = {customer['total_spent']},
    points = {customer['points']},
    loyalty_level = '{customer['loyalty_level']}',
    color_tag = '{customer['color_tag']}',
    total_purchases = {customer['total_purchases']},
    last_visit = '{customer['last_visit']}',
    last_purchase_date = '{customer['last_purchase_date']}',
    updated_at = NOW()
WHERE phone = '{customer['phone']}';

-- Verify the update
SELECT name, total_spent, points, loyalty_level, color_tag 
FROM customers 
WHERE phone = '{customer['phone']}';
"""
    
    print("SQL UPDATE STATEMENT:")
    print("-" * 25)
    print(sql_update)
    
    # Save to file
    with open('fix_customer_0186.sql', 'w', encoding='utf-8') as f:
        f.write(sql_update)
    
    print("✅ SQL file created: fix_customer_0186.sql")
    print()
    print("🚀 TO FIX THIS CUSTOMER:")
    print("1. Run the SQL statement above in your database")
    print("2. Or run the file: fix_customer_0186.sql")
    print("3. Verify the customer data is updated correctly")

def show_all_customers_needing_update():
    """Show all customers that need database updates"""
    print("📋 ALL CUSTOMERS NEEDING DATABASE UPDATES")
    print("=" * 50)
    print()
    
    try:
        with open('customer_database_updates_fixed.csv', 'r') as f:
            reader = csv.DictReader(f)
            customers = list(reader)
        
        print(f"Total customers in CSV: {len(customers)}")
        print()
        print("Top 10 customers by spending:")
        print()
        
        # Sort by total spent
        customers.sort(key=lambda x: int(x['total_spent']), reverse=True)
        
        for i, customer in enumerate(customers[:10], 1):
            print(f"{i:2d}. {customer['name']}")
            print(f"     📞 {customer['phone']}")
            print(f"     💰 TSh {int(customer['total_spent']):,}")
            print(f"     🏷️  {customer['loyalty_level'].upper()}")
            print(f"     🎯 {int(customer['points']):,} points")
            print()
        
        print("🚨 IMPORTANT:")
        print("Your database still shows old data because the SQL update hasn't been applied yet.")
        print("You need to run the customer_database_updates_fixed.sql file in your database.")
        
    except FileNotFoundError:
        print("CSV file not found")

def create_quick_update_script():
    """Create a quick update script for immediate use"""
    print("⚡ CREATING QUICK UPDATE SCRIPT")
    print("=" * 35)
    
    quick_sql = """-- Quick Customer Data Update
-- This will update all customers with their correct transaction data

-- First, ensure all required columns exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Update Customer 0186 specifically
UPDATE customers SET
    name = 'Customer 0186',
    total_spent = 29396000,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 129,
    last_visit = '2023-10-03T16:43:02Z',
    last_purchase_date = '2023-10-03T16:43:02Z',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Update Customer 0001 (your biggest customer)
UPDATE customers SET
    name = 'Customer 0001',
    total_spent = 81085098,
    points = 81085,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 307,
    last_visit = '2023-10-04T11:15:33Z',
    last_purchase_date = '2023-10-04T11:15:33Z',
    updated_at = NOW()
WHERE phone = '25564000001';

-- Update Customer 0232
UPDATE customers SET
    name = 'Customer 0232',
    total_spent = 5717729,
    points = 5717,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 26,
    last_visit = '2023-08-30T16:51:10Z',
    last_purchase_date = '2023-08-30T16:51:10Z',
    updated_at = NOW()
WHERE phone = '25564000232';

-- Verify updates
SELECT name, phone, total_spent, points, loyalty_level, color_tag 
FROM customers 
WHERE phone IN ('25564000186', '25564000001', '25564000232')
ORDER BY total_spent DESC;
"""
    
    with open('quick_customer_update.sql', 'w', encoding='utf-8') as f:
        f.write(quick_sql)
    
    print("✅ Quick update script created: quick_customer_update.sql")
    print()
    print("This script will:")
    print("  • Add missing columns if needed")
    print("  • Update Customer 0186 with correct data")
    print("  • Update Customer 0001 (your biggest customer)")
    print("  • Update Customer 0232")
    print("  • Verify the updates")

def main():
    """Main function"""
    print("🚨 FIXING CUSTOMER 0186 DATA ISSUE")
    print("=" * 45)
    print()
    
    print("PROBLEM IDENTIFIED:")
    print("Your database shows old data because the SQL update hasn't been applied yet.")
    print()
    
    # Show current vs correct data
    generate_customer_0186_sql()
    print()
    
    # Show all customers needing updates
    show_all_customers_needing_update()
    print()
    
    # Create quick update script
    create_quick_update_script()
    print()
    
    print("🎯 SOLUTION:")
    print("=" * 15)
    print("1. Run the SQL update in your database")
    print("2. Use either:")
    print("   • customer_database_updates_fixed.sql (all 153 customers)")
    print("   • quick_customer_update.sql (top 3 customers)")
    print("   • fix_customer_0186.sql (just Customer 0186)")
    print()
    print("3. After running the SQL, Customer 0186 will show:")
    print("   • Name: Customer 0186")
    print("   • Total Spent: TSh 29,396,000")
    print("   • Points: 29,396")
    print("   • Level: Platinum")
    print("   • Tag: VIP")

if __name__ == "__main__":
    main()
