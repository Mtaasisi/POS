#!/usr/bin/env python3
"""
Diagnose Customer Data Issue - Check why customer data is not showing correctly
"""
import json
import csv

def check_customer_data():
    """Check customer data in different files"""
    print("🔍 DIAGNOSING CUSTOMER DATA ISSUE")
    print("=" * 45)
    print()
    
    # Check CSV data
    print("📋 CHECKING CSV DATA:")
    try:
        with open('COMPLETE_CUSTOMER_DATA.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['phone'] == '25564000186':  # Customer 0186
                    print(f"  CSV Data for Customer 0186:")
                    print(f"    Name: {row['name']}")
                    print(f"    Total Spent: {row['total_spent']}")
                    print(f"    Points: {row['points']}")
                    print(f"    Orders: {row['total_purchases']}")
                    print(f"    Loyalty Level: {row['loyalty_level']}")
                    break
    except FileNotFoundError:
        print("  ❌ COMPLETE_CUSTOMER_DATA.csv not found")
    
    print()
    
    # Check transaction data
    print("📋 CHECKING TRANSACTION DATA:")
    try:
        with open('comprehensive_customer_data.json', 'r') as f:
            data = json.load(f)
            if '25564000186' in data:
                customer = data['25564000186']
                print(f"  Transaction Data for Customer 0186:")
                print(f"    Name: {customer.get('name', 'No name')}")
                print(f"    Total Received: {customer.get('total_received', 0)}")
                print(f"    Transaction Count: {customer.get('transaction_count', 0)}")
            else:
                print("  ❌ Customer 0186 not found in transaction data")
    except FileNotFoundError:
        print("  ❌ comprehensive_customer_data.json not found")
    
    print()

def create_quick_fix_sql():
    """Create a quick fix SQL for Customer 0186"""
    print("🔧 CREATING QUICK FIX SQL")
    print("=" * 30)
    
    quick_fix_sql = """-- QUICK FIX FOR CUSTOMER 0186 DATA ISSUE
-- This will fix the customer data that's showing Tsh 0

-- First, check current data
SELECT name, total_spent, points, total_purchases, loyalty_level 
FROM customers 
WHERE phone = '25564000186';

-- Update Customer 0186 with correct data
UPDATE customers SET
    name = 'PREMIUM CUSTOMER 0186',
    total_spent = 29396000,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 129,
    last_visit = '2023-10-03T16:43:02Z',
    last_purchase_date = '2023-10-03T16:43:02Z',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Verify the fix
SELECT name, total_spent, points, total_purchases, loyalty_level 
FROM customers 
WHERE phone = '25564000186';

-- Check if the issue is with column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('total_spent', 'points', 'total_purchases', 'loyalty_level');
"""
    
    with open('QUICK_FIX_CUSTOMER_0186.sql', 'w', encoding='utf-8') as f:
        f.write(quick_fix_sql)
    
    print("✅ Quick fix SQL created: QUICK_FIX_CUSTOMER_0186.sql")

def create_application_fix_guide():
    """Create guide for fixing application data fetching"""
    print("📱 CREATING APPLICATION FIX GUIDE")
    print("=" * 40)
    
    guide = """# CUSTOMER DATA FETCHING ISSUE - FIX GUIDE

## Problem Identified:
Your application is showing:
- Total Spent: Tsh 0 (should be Tsh 29,396,000)
- Orders: 0 (should be 129)
- Points: 29396 (correct)
- Devices: 0 (correct)
- Calls: 0 (correct)

## Possible Causes:

### 1. Database Update Not Applied
- The SQL update hasn't been run in your database yet
- Solution: Run COMPLETE_CUSTOMER_UPDATE.sql in your database

### 2. Application Cache Issue
- Your application might be caching old data
- Solution: Clear application cache or restart the application

### 3. Database Connection Issue
- Application might be connecting to wrong database
- Solution: Check database connection settings

### 4. Column Name Mismatch
- Application might be looking for different column names
- Solution: Check if application uses 'total_spent' vs 'totalSpent'

## Quick Fixes:

### Fix 1: Run Database Update
```sql
UPDATE customers SET
    total_spent = 29396000,
    total_purchases = 129,
    points = 29396,
    loyalty_level = 'platinum'
WHERE phone = '25564000186';
```

### Fix 2: Check Application Code
Look for these field mappings in your application:
- total_spent → totalSpent
- total_purchases → totalPurchases or orders
- loyalty_level → loyaltyLevel

### Fix 3: Clear Cache
- Restart your application server
- Clear browser cache
- Clear any application cache

## Verification:
After applying fixes, customer should show:
- Total Spent: Tsh 29,396,000
- Orders: 129
- Points: 29396
- Level: Platinum
"""
    
    with open('APPLICATION_FIX_GUIDE.md', 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print("✅ Application fix guide created: APPLICATION_FIX_GUIDE.md")

def show_troubleshooting_steps():
    """Show troubleshooting steps"""
    print("🔧 TROUBLESHOOTING STEPS")
    print("=" * 30)
    print()
    print("1. CHECK DATABASE:")
    print("   • Run: SELECT * FROM customers WHERE phone = '25564000186';")
    print("   • Verify total_spent = 29396000")
    print("   • Verify total_purchases = 129")
    print()
    print("2. CHECK APPLICATION:")
    print("   • Look for field mapping issues")
    print("   • Check if using 'total_spent' vs 'totalSpent'")
    print("   • Verify database connection")
    print()
    print("3. CLEAR CACHE:")
    print("   • Restart application server")
    print("   • Clear browser cache")
    print("   • Clear application cache")
    print()
    print("4. RUN QUICK FIX:")
    print("   • Use QUICK_FIX_CUSTOMER_0186.sql")
    print("   • Or run COMPLETE_CUSTOMER_UPDATE.sql")
    print()

def main():
    """Main function"""
    print("🚨 CUSTOMER DATA FETCHING ISSUE DIAGNOSIS")
    print("=" * 50)
    print()
    
    print("ISSUE IDENTIFIED:")
    print("Your application shows:")
    print("  • Total Spent: Tsh 0 (should be Tsh 29,396,000)")
    print("  • Orders: 0 (should be 129)")
    print("  • Points: 29396 (correct)")
    print()
    
    # Check data sources
    check_customer_data()
    
    # Create fixes
    create_quick_fix_sql()
    create_application_fix_guide()
    
    # Show troubleshooting
    show_troubleshooting_steps()
    
    print("🎯 MOST LIKELY SOLUTION:")
    print("=" * 30)
    print("The database update hasn't been applied yet.")
    print("Run the COMPLETE_CUSTOMER_UPDATE.sql file in your database.")
    print()
    print("Files created to help:")
    print("  • QUICK_FIX_CUSTOMER_0186.sql - Quick fix for this customer")
    print("  • APPLICATION_FIX_GUIDE.md - Complete troubleshooting guide")

if __name__ == "__main__":
    main()
