#!/usr/bin/env python3
"""
Generate Complete Customer Update - Create SQL with ALL customer names and data
"""
import json
import csv
import re

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

def create_improved_name(customer):
    """Create improved name for generic customers"""
    phone = customer['phone']
    total_spent = int(customer['total_spent'])
    transaction_count = int(customer['total_purchases'])
    
    if total_spent >= 50000000:  # TSh 50M+
        return f"VIP CUSTOMER {phone[-4:]}"
    elif total_spent >= 20000000:  # TSh 20M+
        return f"PREMIUM CUSTOMER {phone[-4:]}"
    elif total_spent >= 5000000:  # TSh 5M+
        return f"GOLD CUSTOMER {phone[-4:]}"
    elif transaction_count >= 100:
        return f"FREQUENT CUSTOMER {phone[-4:]}"
    elif transaction_count >= 50:
        return f"REGULAR CUSTOMER {phone[-4:]}"
    else:
        return f"CUSTOMER {phone[-4:]}"

def generate_complete_sql(customers, transaction_data):
    """Generate complete SQL with all customer updates"""
    print("🔧 GENERATING COMPLETE CUSTOMER UPDATE SQL")
    print("=" * 50)
    
    sql_content = """-- COMPLETE CUSTOMER UPDATE - ALL NAMES AND DATA
-- This updates all 153 customers with their proper names and transaction data
-- Run this file in your database to update everything at once

-- Ensure all required columns exist
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

"""
    
    # Sort customers by total spent (descending)
    sorted_customers = sorted(customers, key=lambda x: int(x['total_spent']), reverse=True)
    
    for customer in sorted_customers:
        phone = customer['phone']
        current_name = customer['name']
        
        # Determine the best name to use
        if phone in transaction_data and transaction_data[phone].get('name'):
            real_name = transaction_data[phone]['name']
            if real_name and real_name != 'Unknown':
                final_name = real_name
            else:
                final_name = create_improved_name(customer)
        else:
            if re.match(r'^Customer \d+$', current_name):
                final_name = create_improved_name(customer)
            else:
                final_name = current_name
        
        # Generate SQL update
        update_sql = f"""
-- {final_name} ({phone}) - TSh {int(customer['total_spent']):,}
UPDATE customers SET
    name = '{final_name.replace("'", "''")}',
    total_spent = {customer['total_spent']},
    points = {customer['points']},
    loyalty_level = '{customer['loyalty_level']}',
    color_tag = '{customer['color_tag']}',
    total_purchases = {customer['total_purchases']},
    last_visit = '{customer['last_visit']}',
    last_purchase_date = '{customer['last_purchase_date']}',
    updated_at = NOW()
WHERE phone = '{phone}';
"""
        sql_content += update_sql
    
    # Add verification queries
    sql_content += """
-- Verify the updates - Top 20 customers
SELECT 
    name, 
    phone, 
    total_spent, 
    points, 
    loyalty_level, 
    color_tag,
    total_purchases
FROM customers 
WHERE total_spent > 0
ORDER BY total_spent DESC
LIMIT 20;

-- Show summary statistics
SELECT 
    COUNT(*) as total_customers,
    SUM(total_spent) as total_revenue,
    SUM(points) as total_points,
    COUNT(CASE WHEN loyalty_level = 'platinum' THEN 1 END) as platinum_customers,
    COUNT(CASE WHEN loyalty_level = 'gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'bronze' THEN 1 END) as bronze_customers
FROM customers 
WHERE total_spent > 0;
"""
    
    return sql_content

def export_complete_csv(customers, transaction_data):
    """Export complete CSV with all updated names"""
    print("📝 EXPORTING COMPLETE CUSTOMER CSV")
    print("=" * 40)
    
    updated_customers = []
    
    for customer in customers:
        phone = customer['phone']
        current_name = customer['name']
        
        # Determine the best name to use
        if phone in transaction_data and transaction_data[phone].get('name'):
            real_name = transaction_data[phone]['name']
            if real_name and real_name != 'Unknown':
                customer['name'] = real_name
            else:
                customer['name'] = create_improved_name(customer)
        else:
            if re.match(r'^Customer \d+$', current_name):
                customer['name'] = create_improved_name(customer)
        
        updated_customers.append(customer)
    
    # Export CSV
    with open('COMPLETE_CUSTOMER_DATA.csv', 'w', newline='', encoding='utf-8') as f:
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
    
    print("✅ Complete CSV exported: COMPLETE_CUSTOMER_DATA.csv")
    return updated_customers

def show_customer_summary(updated_customers):
    """Show summary of all customers"""
    print("📊 CUSTOMER SUMMARY")
    print("=" * 25)
    print()
    
    total_customers = len(updated_customers)
    total_revenue = sum(int(c['total_spent']) for c in updated_customers)
    total_points = sum(int(c['points']) for c in updated_customers)
    
    # Count by loyalty level
    level_counts = {}
    for customer in updated_customers:
        level = customer['loyalty_level']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print(f"Total customers: {total_customers}")
    print(f"Total revenue: TSh {total_revenue:,}")
    print(f"Total points: {total_points:,}")
    print()
    
    print("Loyalty level breakdown:")
    for level in ['platinum', 'gold', 'silver', 'bronze']:
        if level in level_counts:
            count = level_counts[level]
            print(f"  {level.capitalize()}: {count} customers")
    
    print()
    print("Top 10 customers:")
    sorted_customers = sorted(updated_customers, key=lambda x: int(x['total_spent']), reverse=True)
    for i, customer in enumerate(sorted_customers[:10], 1):
        print(f"  {i:2d}. {customer['name']} - TSh {int(customer['total_spent']):,}")

def main():
    """Main function"""
    print("🔄 GENERATING COMPLETE CUSTOMER UPDATE")
    print("=" * 50)
    print()
    
    # Load data
    transaction_data = load_transaction_data()
    if not transaction_data:
        return
    
    customers = load_customer_data()
    if not customers:
        return
    
    print(f"📋 Processing {len(customers)} customers...")
    print()
    
    # Generate complete SQL
    sql_content = generate_complete_sql(customers, transaction_data)
    
    # Write SQL file
    with open('COMPLETE_CUSTOMER_UPDATE.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("✅ Complete SQL file created: COMPLETE_CUSTOMER_UPDATE.sql")
    print()
    
    # Export complete CSV
    updated_customers = export_complete_csv(customers, transaction_data)
    
    # Show summary
    show_customer_summary(updated_customers)
    
    print()
    print("🎉 COMPLETE CUSTOMER UPDATE READY!")
    print("=" * 40)
    print()
    print("Files created:")
    print("  • COMPLETE_CUSTOMER_UPDATE.sql - Run this in your database")
    print("  • COMPLETE_CUSTOMER_DATA.csv - Complete customer data")
    print()
    print("🚀 This will update ALL 153 customers with:")
    print("  • Real names from SMS transactions")
    print("  • Improved descriptive names for generic customers")
    print("  • Complete transaction data and loyalty levels")
    print("  • Proper points and spending amounts")
    print()
    print("Just run the SQL file in your database to update everything!")

if __name__ == "__main__":
    main()
