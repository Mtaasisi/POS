#!/usr/bin/env python3
"""
Direct Supabase integration for customer transaction data
Updates customer database with transaction information
"""
import json
import os
from datetime import datetime
from collections import defaultdict
import uuid

# You'll need to install: pip install supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Supabase client not available. Install with: pip install supabase")

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

def create_supabase_client():
    """Create Supabase client"""
    if not SUPABASE_AVAILABLE:
        return None
    
    # You need to set these environment variables or replace with your actual values
    url = os.getenv('SUPABASE_URL', 'your-supabase-url')
    key = os.getenv('SUPABASE_ANON_KEY', 'your-supabase-anon-key')
    
    if url == 'your-supabase-url' or key == 'your-supabase-anon-key':
        print("⚠️  Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
        print("   Or update the script with your actual Supabase credentials")
        return None
    
    try:
        supabase: Client = create_client(url, key)
        return supabase
    except Exception as e:
        print(f"❌ Error creating Supabase client: {e}")
        return None

def check_existing_customer(supabase, phone):
    """Check if customer already exists by phone number"""
    try:
        result = supabase.table('customers').select('id, name, total_spent').eq('phone', phone).execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        print(f"❌ Error checking existing customer: {e}")
        return None

def upsert_customer(supabase, customer_data):
    """Insert or update customer in Supabase"""
    try:
        # Check if customer exists
        existing = check_existing_customer(supabase, customer_data['phone'])
        
        if existing:
            # Update existing customer
            print(f"🔄 Updating existing customer: {customer_data['name']} ({customer_data['phone']})")
            result = supabase.table('customers').update({
                'name': customer_data['name'],
                'total_spent': customer_data['total_spent'],
                'loyalty_level': customer_data['loyalty_level'],
                'color_tag': customer_data['color_tag'],
                'points': customer_data['points'],
                'last_visit': customer_data['last_visit'],
                'total_purchases': customer_data['total_purchases'],
                'last_purchase_date': customer_data['last_purchase_date'],
                'updated_at': customer_data['updated_at'],
                'customer_tag': customer_data['customer_tag'],
                'notes': customer_data['notes']
            }).eq('phone', customer_data['phone']).execute()
        else:
            # Insert new customer
            print(f"➕ Adding new customer: {customer_data['name']} ({customer_data['phone']})")
            result = supabase.table('customers').insert(customer_data).execute()
        
        return result
    except Exception as e:
        print(f"❌ Error upserting customer {customer_data['name']}: {e}")
        return None

def integrate_customers_to_supabase(transaction_data, dry_run=True):
    """Integrate customer data into Supabase database"""
    print("=== SUPABASE CUSTOMER INTEGRATION ===\n")
    
    if not SUPABASE_AVAILABLE:
        print("❌ Supabase client not available. Please install: pip install supabase")
        return
    
    supabase = create_supabase_client()
    if not supabase:
        print("❌ Could not create Supabase client")
        return
    
    if dry_run:
        print("🧪 DRY RUN MODE - No actual database changes will be made")
    
    customer_updates = []
    success_count = 0
    error_count = 0
    
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
            
            # Create customer data
            customer_data = {
                'id': str(uuid.uuid4()),
                'name': data['name'] if data['name'] and data['name'] != 'Unknown' else f'Customer {phone[-4:]}',
                'phone': phone,
                'email': None,
                'whatsapp': phone,
                'gender': 'other',
                'city': 'Dar es Salaam',
                'country': 'Tanzania',
                'notes': f'Auto-imported from SMS transactions. Total transactions: {transaction_count}',
                'is_active': True,
                'color_tag': color_tag,
                'loyalty_level': loyalty_level,
                'total_spent': total_spent,
                'last_visit': last_transaction_date,
                'points': points,
                'referral_source': 'SMS Import',
                'total_purchases': transaction_count,
                'last_purchase_date': last_transaction_date,
                'created_at': first_transaction_date,
                'updated_at': datetime.now().isoformat() + 'Z',
                'created_by': 'system_import',
                'whatsapp_opt_out': False,
                'initial_notes': f'Customer imported from SMS transaction data. First transaction: {first_transaction_date}',
                'customer_tag': color_tag
            }
            
            customer_updates.append(customer_data)
            
            if not dry_run:
                result = upsert_customer(supabase, customer_data)
                if result:
                    success_count += 1
                else:
                    error_count += 1
            else:
                print(f"📝 Would {'update' if check_existing_customer(supabase, phone) else 'create'}: {customer_data['name']} - {loyalty_level.capitalize()} - TSh {total_spent:,}")
                success_count += 1
    
    print(f"\n=== INTEGRATION SUMMARY ===")
    print(f"Total customers processed: {len(customer_updates)}")
    if not dry_run:
        print(f"Successful operations: {success_count}")
        print(f"Failed operations: {error_count}")
    else:
        print(f"Dry run completed: {success_count} customers would be processed")
    
    return customer_updates

def create_customer_import_script():
    """Create a script for manual customer import"""
    script_content = '''#!/usr/bin/env python3
"""
Manual Customer Import Script
Run this script to import customers into your Supabase database
"""
import os
from supabase import create_client, Client

# Set your Supabase credentials here
SUPABASE_URL = "your-supabase-url-here"
SUPABASE_ANON_KEY = "your-supabase-anon-key-here"

def main():
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Read customer data from CSV
    import csv
    customers_to_import = []
    
    with open('customer_database_updates.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            customers_to_import.append(row)
    
    print(f"Importing {len(customers_to_import)} customers...")
    
    # Import customers
    for customer in customers_to_import:
        try:
            # Convert string values to appropriate types
            customer['total_spent'] = float(customer['total_spent'])
            customer['points'] = int(customer['points'])
            customer['total_purchases'] = int(customer['total_purchases'])
            customer['is_active'] = customer['is_active'].lower() == 'true'
            customer['whatsapp_opt_out'] = customer.get('whatsapp_opt_out', 'false').lower() == 'true'
            
            # Insert customer
            result = supabase.table('customers').insert(customer).execute()
            print(f"✅ Imported: {customer['name']}")
            
        except Exception as e:
            print(f"❌ Error importing {customer['name']}: {e}")
    
    print("Import complete!")

if __name__ == "__main__":
    main()
'''
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/manual_customer_import.py', 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print("📝 Manual import script created: manual_customer_import.py")

def main():
    """Main integration function"""
    print("🔄 SUPABASE CUSTOMER INTEGRATION")
    print("=" * 60)
    
    # Load transaction data
    transaction_data = load_transaction_data()
    if not transaction_data:
        return
    
    # Run dry run first
    print("🧪 Running dry run...")
    customer_updates = integrate_customers_to_supabase(transaction_data, dry_run=True)
    
    if customer_updates:
        print(f"\n✅ Dry run completed successfully!")
        print(f"📊 Found {len(customer_updates)} customers to import")
        
        # Ask user if they want to proceed
        print(f"\n🚀 To proceed with actual import:")
        print(f"   1. Set your Supabase credentials in the script")
        print(f"   2. Change dry_run=False in the script")
        print(f"   3. Run the script again")
        
        # Create manual import script
        create_customer_import_script()
        
        print(f"\n📁 Alternative: Use the generated CSV files:")
        print(f"   - customer_database_updates.csv")
        print(f"   - customer_database_updates.sql")
        print(f"   - manual_customer_import.py")

if __name__ == "__main__":
    main()
