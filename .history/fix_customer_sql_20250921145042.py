#!/usr/bin/env python3
"""
Fix the customer SQL file to match the actual database schema
Remove the 'country' column that doesn't exist
"""
import re

def fix_sql_file():
    """Fix the SQL file to remove the country column"""
    print("🔧 FIXING CUSTOMER SQL FILE")
    print("=" * 40)
    
    # Read the original SQL file
    with open('customer_database_updates.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove 'country' from the INSERT statements
    # Pattern 1: Remove country from column list
    content = re.sub(
        r'INSERT INTO customers \(\s*\n\s*id, name, phone, email, whatsapp, gender, city, country,',
        'INSERT INTO customers (\n    id, name, phone, email, whatsapp, gender, city,',
        content,
        flags=re.MULTILINE
    )
    
    # Pattern 2: Remove country value from VALUES
    content = re.sub(
        r"'Dar es Salaam',\s*\n\s*'Tanzania',",
        "'Dar es Salaam',",
        content,
        flags=re.MULTILINE
    )
    
    # Also fix the CSV file to remove country column
    print("📝 Fixing CSV file...")
    with open('customer_database_updates.csv', 'r', encoding='utf-8') as f:
        csv_content = f.read()
    
    # Remove country column from CSV header and data
    lines = csv_content.split('\n')
    if lines:
        # Fix header
        header = lines[0]
        if 'country' in header:
            header = header.replace(',country', '')
            lines[0] = header
        
        # Fix data rows
        for i in range(1, len(lines)):
            if lines[i].strip():
                parts = lines[i].split(',')
                # Remove the country field (index 7 if it exists)
                if len(parts) > 7 and parts[7] == 'Tanzania':
                    parts.pop(7)
                    lines[i] = ','.join(parts)
        
        # Write fixed CSV
        with open('customer_database_updates_fixed.csv', 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
    
    # Write fixed SQL
    with open('customer_database_updates_fixed.sql', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fixed files created:")
    print("   - customer_database_updates_fixed.sql")
    print("   - customer_database_updates_fixed.csv")
    
    # Show the difference
    print("\n📊 CHANGES MADE:")
    print("   - Removed 'country' column from INSERT statements")
    print("   - Removed 'Tanzania' values from INSERT statements")
    print("   - Updated CSV file to match database schema")
    
    return True

def show_fixed_sample():
    """Show a sample of the fixed SQL"""
    print("\n📋 SAMPLE OF FIXED SQL:")
    print("-" * 30)
    
    sample_sql = """-- Insert new customer: Customer 0001 (25564000001)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f568a423-b6c0-4f4d-a7e2-8954f0dfde73',
    'Customer 0001',
    '25564000001',
    NULL,
    '25564000001',
    'other',
    'Dar es Salaam',
    'Auto-imported from SMS transactions. Total transactions: 307',
    true,
    'vip',
    'platinum',
    81085098,
    '2023-10-04T11:15:33Z',
    81085,
    'SMS Import',
    307,
    '2023-10-04T11:15:33Z',
    '2022-09-07T12:04:21Z',
    '2024-01-19T10:00:00Z',
    'system_import',
    false,
    'Customer imported from SMS transaction data. First transaction: 2022-09-07T12:04:21Z',
    'vip'
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
    customer_tag = EXCLUDED.customer_tag;"""
    
    print(sample_sql)

def main():
    """Main function"""
    print("🚨 FIXING DATABASE SCHEMA MISMATCH")
    print("=" * 50)
    print()
    print("The error occurred because the SQL file includes a 'country' column")
    print("that doesn't exist in your database schema.")
    print()
    
    if fix_sql_file():
        show_fixed_sample()
        
        print("\n🎯 NEXT STEPS:")
        print("1. Use the FIXED files:")
        print("   - customer_database_updates_fixed.sql")
        print("   - customer_database_updates_fixed.csv")
        print()
        print("2. Run the fixed SQL file in your database")
        print("3. The error should be resolved!")
        print()
        print("✅ Ready to integrate your customers!")

if __name__ == "__main__":
    main()
