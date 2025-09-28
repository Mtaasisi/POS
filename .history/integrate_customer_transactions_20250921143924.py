#!/usr/bin/env python3
"""
Integrate SMS transaction data into existing customer database
Updates customer levels, spending, dates, and all relevant fields
"""
import json
import csv
from datetime import datetime, timedelta
from collections import defaultdict
import uuid

def load_transaction_data():
    """Load comprehensive transaction data"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Transaction data file not found. Please run extract_all_transactions.py first.")
        return None

def calculate_customer_level(total_spent):
    """Calculate customer loyalty level based on total spending"""
    if total_spent >= 2000000:  # TSh 2M+
        return 'platinum'
    elif total_spent >= 1000000:  # TSh 1M+
        return 'gold'
    elif total_spent >= 500000:   # TSh 500K+
        return 'silver'
    else:
        return 'bronze'

def calculate_customer_tag(total_spent, transaction_count):
    """Calculate customer color tag based on spending and behavior"""
    if total_spent >= 2000000:
        return 'vip'
    elif total_spent >= 1000000:
        return 'vip'
    elif transaction_count >= 10:
        return 'purchased'
    elif total_spent >= 100000:
        return 'purchased'
    else:
        return 'new'

def calculate_loyalty_points(total_spent):
    """Calculate loyalty points based on total spending (1 point per TSh 1000)"""
    return int(total_spent / 1000)

def parse_transaction_date(date_str):
    """Parse transaction date string to ISO format"""
    try:
        # Format: "Sep 4, 2022 11:05:49 AM"
        date_obj = datetime.strptime(date_str, "%b %d, %Y %I:%M:%S %p")
        return date_obj.isoformat() + 'Z'
    except:
        return datetime.now().isoformat() + 'Z'

def get_first_transaction_date(transactions):
    """Get the earliest transaction date"""
    if not transactions:
        return datetime.now().isoformat() + 'Z'
    
    dates = []
    for trans in transactions:
        if trans['type'] == 'received':
            try:
                date_obj = datetime.strptime(trans['date'], "%b %d, %Y %I:%M:%S %p")
                dates.append(date_obj)
            except:
                continue
    
    if dates:
        return min(dates).isoformat() + 'Z'
    return datetime.now().isoformat() + 'Z'

def get_last_transaction_date(transactions):
    """Get the most recent transaction date"""
    if not transactions:
        return datetime.now().isoformat() + 'Z'
    
    dates = []
    for trans in transactions:
        if trans['type'] == 'received':
            try:
                date_obj = datetime.strptime(trans['date'], "%b %d, %Y %I:%M:%S %p")
                dates.append(date_obj)
            except:
                continue
    
    if dates:
        return max(dates).isoformat() + 'Z'
    return datetime.now().isoformat() + 'Z'

def create_customer_update_data(transaction_data):
    """Create customer update data for database integration"""
    print("=== CREATING CUSTOMER UPDATE DATA ===\n")
    
    customer_updates = []
    
    for phone, data in transaction_data.items():
        if data['total_received'] > 0:  # Only process customers with payments
            # Calculate customer metrics
            total_spent = data['total_received']
            transaction_count = data['transaction_count']
            
            # Calculate customer level and tag
            loyalty_level = calculate_customer_level(total_spent)
            color_tag = calculate_customer_tag(total_spent, transaction_count)
            points = calculate_loyalty_points(total_spent)
            
            # Get dates
            first_transaction_date = get_first_transaction_date(data['transactions'])
            last_transaction_date = get_last_transaction_date(data['transactions'])
            
            # Create customer update record
            customer_update = {
                'id': str(uuid.uuid4()),  # Generate new UUID for new customers
                'name': data['name'] if data['name'] and data['name'] != 'Unknown' else f'Customer {phone[-4:]}',
                'phone': phone,
                'email': None,  # Not available from SMS data
                'whatsapp': phone,  # Assume same as phone
                'gender': 'other',  # Default value
                'city': 'Dar es Salaam',  # Default based on your location
                'country': 'Tanzania',
                'address': None,
                'birth_month': None,
                'birth_day': None,
                'notes': f'Auto-imported from SMS transactions. Total transactions: {transaction_count}',
                'is_active': True,
                'color_tag': color_tag,
                'loyalty_level': loyalty_level,
                'total_spent': total_spent,
                'last_visit': last_transaction_date,
                'points': points,
                'referred_by': None,
                'referral_source': 'SMS Import',
                'total_purchases': transaction_count,
                'last_purchase_date': last_transaction_date,
                'created_at': first_transaction_date,  # Use first transaction as join date
                'updated_at': datetime.now().isoformat() + 'Z',
                'created_by': 'system_import',
                'whatsapp_opt_out': False,
                'initial_notes': f'Customer imported from SMS transaction data. First transaction: {first_transaction_date}',
                'customer_tag': color_tag,
                # Additional fields for comprehensive data
                'transaction_history': data['transactions'],
                'services_used': data['services_used'],
                'total_sent': data['total_sent']
            }
            
            customer_updates.append(customer_update)
    
    # Sort by total spent (descending)
    customer_updates.sort(key=lambda x: x['total_spent'], reverse=True)
    
    return customer_updates

def generate_sql_updates(customer_updates):
    """Generate SQL statements for customer updates"""
    print("=== GENERATING SQL UPDATE STATEMENTS ===\n")
    
    sql_statements = []
    
    # Create table if not exists (for reference)
    create_table_sql = """
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
    
    sql_statements.append(create_table_sql)
    
    # Generate INSERT/UPDATE statements
    for customer in customer_updates:
        # Check if customer exists by phone
        check_sql = f"""
-- Check if customer exists: {customer['name']} ({customer['phone']})
SELECT id FROM customers WHERE phone = '{customer['phone']}';
"""
        
        # Insert new customer
        insert_sql = f"""
-- Insert new customer: {customer['name']} ({customer['phone']})
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
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
    '{customer['country']}',
    '{customer['notes'].replace("'", "''")}',
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
    '{customer['initial_notes'].replace("'", "''")}',
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
        
        sql_statements.append(check_sql)
        sql_statements.append(insert_sql)
    
    return sql_statements

def export_customer_data(customer_updates):
    """Export customer data to CSV for easy review"""
    print("=== EXPORTING CUSTOMER DATA ===\n")
    
    # Main customer data
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_database_updates.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'name', 'phone', 'email', 'whatsapp', 'gender', 'city', 'country',
            'color_tag', 'loyalty_level', 'total_spent', 'points', 'total_purchases',
            'last_visit', 'last_purchase_date', 'created_at', 'referral_source',
            'customer_tag', 'is_active'
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for customer in customer_updates:
            writer.writerow({
                'id': customer['id'],
                'name': customer['name'],
                'phone': customer['phone'],
                'email': customer['email'],
                'whatsapp': customer['whatsapp'],
                'gender': customer['gender'],
                'city': customer['city'],
                'country': customer['country'],
                'color_tag': customer['color_tag'],
                'loyalty_level': customer['loyalty_level'],
                'total_spent': customer['total_spent'],
                'points': customer['points'],
                'total_purchases': customer['total_purchases'],
                'last_visit': customer['last_visit'],
                'last_purchase_date': customer['last_purchase_date'],
                'created_at': customer['created_at'],
                'referral_source': customer['referral_source'],
                'customer_tag': customer['customer_tag'],
                'is_active': customer['is_active']
            })
    
    # Summary report
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_import_summary.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['loyalty_level', 'count', 'total_spent', 'avg_spent', 'total_points']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        # Group by loyalty level
        level_stats = defaultdict(lambda: {'count': 0, 'total_spent': 0, 'total_points': 0})
        
        for customer in customer_updates:
            level = customer['loyalty_level']
            level_stats[level]['count'] += 1
            level_stats[level]['total_spent'] += customer['total_spent']
            level_stats[level]['total_points'] += customer['points']
        
        for level in ['platinum', 'gold', 'silver', 'bronze']:
            if level in level_stats:
                stats = level_stats[level]
                avg_spent = stats['total_spent'] / stats['count'] if stats['count'] > 0 else 0
                writer.writerow({
                    'loyalty_level': level,
                    'count': stats['count'],
                    'total_spent': stats['total_spent'],
                    'avg_spent': round(avg_spent, 2),
                    'total_points': stats['total_points']
                })
    
    print(f"✅ Customer data exported to:")
    print(f"   - customer_database_updates.csv ({len(customer_updates)} customers)")
    print(f"   - customer_import_summary.csv (summary by loyalty level)")

def display_integration_summary(customer_updates):
    """Display summary of customer integration"""
    print("=== CUSTOMER INTEGRATION SUMMARY ===\n")
    
    total_customers = len(customer_updates)
    total_revenue = sum(customer['total_spent'] for customer in customer_updates)
    total_points = sum(customer['points'] for customer in customer_updates)
    
    # Loyalty level breakdown
    level_counts = defaultdict(int)
    level_revenue = defaultdict(int)
    
    for customer in customer_updates:
        level = customer['loyalty_level']
        level_counts[level] += 1
        level_revenue[level] += customer['total_spent']
    
    print(f"📊 INTEGRATION OVERVIEW:")
    print(f"   Total customers to import: {total_customers}")
    print(f"   Total revenue: TSh {total_revenue:,}")
    print(f"   Total loyalty points: {total_points:,}")
    
    print(f"\n🏆 LOYALTY LEVEL BREAKDOWN:")
    for level in ['platinum', 'gold', 'silver', 'bronze']:
        if level in level_counts:
            count = level_counts[level]
            revenue = level_revenue[level]
            percentage = (count / total_customers) * 100
            print(f"   {level.capitalize()}: {count} customers ({percentage:.1f}%) - TSh {revenue:,}")
    
    print(f"\n📅 DATE RANGES:")
    if customer_updates:
        first_date = min(customer['created_at'] for customer in customer_updates)
        last_date = max(customer['last_visit'] for customer in customer_updates)
        print(f"   First transaction: {first_date}")
        print(f"   Last transaction: {last_date}")
    
    print(f"\n🎯 TOP 10 CUSTOMERS TO IMPORT:")
    for i, customer in enumerate(customer_updates[:10], 1):
        print(f"   {i:2d}. {customer['name']} - {customer['loyalty_level'].capitalize()} - TSh {customer['total_spent']:,}")

def main():
    """Main integration function"""
    print("🔄 CUSTOMER TRANSACTION INTEGRATION")
    print("=" * 60)
    
    # Load transaction data
    transaction_data = load_transaction_data()
    if not transaction_data:
        return
    
    # Create customer update data
    customer_updates = create_customer_update_data(transaction_data)
    
    # Display summary
    display_integration_summary(customer_updates)
    
    # Export data
    export_customer_data(customer_updates)
    
    # Generate SQL
    sql_statements = generate_sql_updates(customer_updates)
    
    # Save SQL to file
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_database_updates.sql', 'w', encoding='utf-8') as f:
        f.write("-- Customer Database Updates from SMS Transaction Data\n")
        f.write("-- Generated automatically from transaction analysis\n\n")
        for statement in sql_statements:
            f.write(statement + "\n")
    
    print(f"\n✅ Integration complete!")
    print(f"📁 Files created:")
    print(f"   - customer_database_updates.csv")
    print(f"   - customer_import_summary.csv") 
    print(f"   - customer_database_updates.sql")
    print(f"\n🚀 Next steps:")
    print(f"   1. Review the CSV files")
    print(f"   2. Run the SQL file in your database")
    print(f"   3. Update your customer management system")

if __name__ == "__main__":
    main()
