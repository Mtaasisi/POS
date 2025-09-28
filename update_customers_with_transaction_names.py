#!/usr/bin/env python3
"""
Update Customers with Transaction Names - Use real names from SMS transactions
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

def create_improved_names_for_generic_customers(customers, transaction_data):
    """Create better names for generic customers based on their spending and behavior"""
    improved_customers = []
    
    for customer in customers:
        phone = customer['phone']
        current_name = customer['name']
        total_spent = int(customer['total_spent'])
        transaction_count = int(customer['total_purchases'])
        
        # Check if it's a generic name
        if re.match(r'^Customer \d+$', current_name):
            # Create a more descriptive name based on spending and behavior
            if total_spent >= 50000000:  # TSh 50M+
                new_name = f"VIP CUSTOMER {phone[-4:]}"
            elif total_spent >= 20000000:  # TSh 20M+
                new_name = f"PREMIUM CUSTOMER {phone[-4:]}"
            elif total_spent >= 5000000:  # TSh 5M+
                new_name = f"GOLD CUSTOMER {phone[-4:]}"
            elif transaction_count >= 100:
                new_name = f"FREQUENT CUSTOMER {phone[-4:]}"
            elif transaction_count >= 50:
                new_name = f"REGULAR CUSTOMER {phone[-4:]}"
            else:
                new_name = f"CUSTOMER {phone[-4:]}"
            
            customer['name'] = new_name
            print(f"✅ {current_name} → {new_name} (TSh {total_spent:,})")
        
        improved_customers.append(customer)
    
    return improved_customers

def show_customers_with_real_names(customers, transaction_data):
    """Show customers with real names from transactions"""
    print("🎯 CUSTOMERS WITH REAL NAMES FROM TRANSACTIONS")
    print("=" * 55)
    print()
    
    real_name_customers = []
    generic_customers = []
    
    for customer in customers:
        phone = customer['phone']
        name = customer['name']
        
        # Check if this phone has a real name in transaction data
        if phone in transaction_data and transaction_data[phone].get('name'):
            real_name = transaction_data[phone]['name']
            if real_name and real_name != 'Unknown':
                customer['name'] = real_name
                real_name_customers.append(customer)
                print(f"✅ {name} → {real_name} ({phone})")
            else:
                generic_customers.append(customer)
        else:
            generic_customers.append(customer)
    
    print(f"\n📊 SUMMARY:")
    print(f"  • {len(real_name_customers)} customers with real names from transactions")
    print(f"  • {len(generic_customers)} customers with improved descriptive names")
    
    return real_name_customers, generic_customers

def show_top_customers_by_name(customers):
    """Show top customers with their names"""
    print("\n🏆 TOP CUSTOMERS BY SPENDING")
    print("=" * 40)
    print()
    
    # Sort by total spent
    sorted_customers = sorted(customers, key=lambda x: int(x['total_spent']), reverse=True)
    
    for i, customer in enumerate(sorted_customers[:15], 1):
        print(f"{i:2d}. {customer['name']}")
        print(f"     📞 {customer['phone']}")
        print(f"     💰 TSh {int(customer['total_spent']):,}")
        print(f"     🏷️  {customer['loyalty_level'].upper()}")
        print(f"     🎯 {int(customer['points']):,} points")
        print(f"     🛒 {customer['total_purchases']} transactions")
        print()

def generate_updated_sql_with_names(customers):
    """Generate SQL with updated customer names"""
    print("🔧 GENERATING SQL WITH UPDATED NAMES")
    print("=" * 45)
    
    sql_content = """-- Customer Database Updates with Improved Names
-- Generated automatically from transaction analysis

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
    
    for customer in customers:
        # Update customer with improved name
        update_sql = f"""
-- Update {customer['name']} ({customer['phone']})
UPDATE customers SET
    name = '{customer['name'].replace("'", "''")}',
    total_spent = {customer['total_spent']},
    points = {customer['points']},
    loyalty_level = '{customer['loyalty_level']}',
    color_tag = '{customer['color_tag']}',
    total_purchases = {customer['total_purchases']},
    last_visit = '{customer['last_visit']}',
    last_purchase_date = '{customer['last_purchase_date']}',
    updated_at = NOW()
WHERE phone = '{customer['phone']}';
"""
        sql_content += update_sql
    
    # Add verification query
    sql_content += """
-- Verify updates
SELECT name, phone, total_spent, points, loyalty_level, color_tag 
FROM customers 
WHERE total_spent > 0
ORDER BY total_spent DESC
LIMIT 20;
"""
    
    # Write SQL file
    with open('customers_with_improved_names.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("✅ SQL file created: customers_with_improved_names.sql")

def export_customers_with_names(customers):
    """Export customers with improved names"""
    print("📝 EXPORTING CUSTOMERS WITH IMPROVED NAMES")
    print("=" * 50)
    
    # Export updated CSV
    with open('customers_with_improved_names.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'name', 'phone', 'email', 'whatsapp', 'gender', 'city',
            'color_tag', 'loyalty_level', 'total_spent', 'points', 'total_purchases',
            'last_visit', 'last_purchase_date', 'created_at', 'referral_source',
            'customer_tag', 'is_active'
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for customer in customers:
            writer.writerow(customer)
    
    print("✅ CSV file created: customers_with_improved_names.csv")

def show_customer_identification_guide():
    """Show guide for identifying customers"""
    print("🔍 CUSTOMER IDENTIFICATION GUIDE")
    print("=" * 40)
    print()
    print("For customers without real names, use these identification methods:")
    print()
    print("1. 📞 Phone Number - Primary identifier")
    print("2. 💰 Spending Amount - Unique spending pattern")
    print("3. 🛒 Transaction Count - Frequency of purchases")
    print("4. 📅 Transaction Dates - When they last purchased")
    print("5. 🏷️  Loyalty Level - Their tier status")
    print()
    print("Example identification:")
    print("  • VIP CUSTOMER 0001 (25564000001) - TSh 81M spent")
    print("  • PREMIUM CUSTOMER 0186 (25564000186) - TSh 29M spent")
    print("  • GOLD CUSTOMER 0232 (25564000232) - TSh 5.7M spent")
    print()
    print("This makes it easy to identify customers even without real names!")

def main():
    """Main function"""
    print("🔄 UPDATING CUSTOMERS WITH TRANSACTION NAMES")
    print("=" * 55)
    print()
    
    # Load data
    transaction_data = load_transaction_data()
    if not transaction_data:
        return
    
    customers = load_customer_data()
    if not customers:
        return
    
    print("📋 STEP 1: IMPROVING GENERIC CUSTOMER NAMES")
    print("-" * 45)
    
    # Improve generic customer names
    improved_customers = create_improved_names_for_generic_customers(customers, transaction_data)
    
    print(f"\n📋 STEP 2: APPLYING REAL NAMES FROM TRANSACTIONS")
    print("-" * 50)
    
    # Apply real names from transactions
    final_customers, remaining_generic = show_customers_with_real_names(improved_customers, transaction_data)
    
    print(f"\n📋 STEP 3: SHOWING TOP CUSTOMERS")
    print("-" * 35)
    
    # Show top customers
    show_top_customers_by_name(final_customers)
    
    print(f"\n📋 STEP 4: GENERATING FILES")
    print("-" * 30)
    
    # Generate files
    generate_updated_sql_with_names(final_customers)
    export_customers_with_names(final_customers)
    
    # Show identification guide
    show_customer_identification_guide()
    
    print("\n🎉 CUSTOMER NAME UPDATE COMPLETE!")
    print("=" * 40)
    print()
    print("Files created:")
    print("  • customers_with_improved_names.sql")
    print("  • customers_with_improved_names.csv")
    print()
    print("🚀 Your customers now have:")
    print("  • Real names from SMS transactions where available")
    print("  • Descriptive names for system-generated customers")
    print("  • Easy identification by spending patterns")
    print("  • Complete transaction history and loyalty data")

if __name__ == "__main__":
    main()
