#!/usr/bin/env python3
"""
Show All Customer Names - Display all customers with their real names from transaction data
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

def show_customers_with_real_names(customers):
    """Show customers with real names"""
    print("🎯 CUSTOMERS WITH REAL NAMES")
    print("=" * 40)
    print()
    
    real_name_customers = []
    generic_name_customers = []
    
    for customer in customers:
        if re.match(r'^Customer \d+$', customer['name']):
            generic_name_customers.append(customer)
        else:
            real_name_customers.append(customer)
    
    print(f"✅ {len(real_name_customers)} customers with real names:")
    print()
    
    # Sort by total spent
    real_name_customers.sort(key=lambda x: int(x['total_spent']), reverse=True)
    
    for i, customer in enumerate(real_name_customers[:20], 1):
        print(f"{i:2d}. {customer['name']}")
        print(f"     📞 {customer['phone']}")
        print(f"     💰 TSh {int(customer['total_spent']):,}")
        print(f"     🏷️  {customer['loyalty_level'].upper()}")
        print(f"     🎯 {int(customer['points']):,} points")
        print()
    
    if len(real_name_customers) > 20:
        print(f"... and {len(real_name_customers) - 20} more customers with real names")
    
    print()
    print(f"⚠️  {len(generic_name_customers)} customers with generic names:")
    print()
    
    for customer in generic_name_customers:
        print(f"   • {customer['name']} - {customer['phone']}")
        print(f"     💰 TSh {int(customer['total_spent']):,}")
        print(f"     🏷️  {customer['loyalty_level'].upper()}")
        print()
    
    return real_name_customers, generic_name_customers

def show_top_customers_by_name(customers):
    """Show top customers by name"""
    print("🏆 TOP CUSTOMERS BY SPENDING (WITH REAL NAMES)")
    print("=" * 55)
    print()
    
    # Filter to only real names and sort by spending
    real_customers = [c for c in customers if not re.match(r'^Customer \d+$', c['name'])]
    real_customers.sort(key=lambda x: int(x['total_spent']), reverse=True)
    
    for i, customer in enumerate(real_customers[:15], 1):
        print(f"{i:2d}. {customer['name']}")
        print(f"     📞 {customer['phone']}")
        print(f"     💰 TSh {int(customer['total_spent']):,}")
        print(f"     🏷️  {customer['loyalty_level'].upper()}")
        print(f"     🎯 {int(customer['points']):,} points")
        print(f"     🛒 {customer['total_purchases']} transactions")
        print()

def show_customers_by_loyalty_level(customers):
    """Show customers grouped by loyalty level"""
    print("🎖️  CUSTOMERS BY LOYALTY LEVEL")
    print("=" * 40)
    print()
    
    # Group by loyalty level
    levels = {
        'platinum': [],
        'gold': [],
        'silver': [],
        'bronze': []
    }
    
    for customer in customers:
        level = customer['loyalty_level']
        if level in levels:
            levels[level].append(customer)
    
    for level in ['platinum', 'gold', 'silver', 'bronze']:
        if levels[level]:
            print(f"🏆 {level.upper()} CUSTOMERS ({len(levels[level])} customers):")
            print("-" * 30)
            
            # Sort by spending
            levels[level].sort(key=lambda x: int(x['total_spent']), reverse=True)
            
            for customer in levels[level][:5]:  # Show top 5
                print(f"  • {customer['name']}")
                print(f"    💰 TSh {int(customer['total_spent']):,}")
                print(f"    📞 {customer['phone']}")
                print()
            
            if len(levels[level]) > 5:
                print(f"  ... and {len(levels[level]) - 5} more {level} customers")
            print()

def show_name_statistics(customers):
    """Show statistics about customer names"""
    print("📊 CUSTOMER NAME STATISTICS")
    print("=" * 35)
    print()
    
    total_customers = len(customers)
    generic_names = sum(1 for c in customers if re.match(r'^Customer \d+$', c['name']))
    real_names = total_customers - generic_names
    
    print(f"Total customers: {total_customers}")
    print(f"Real names: {real_names} ({real_names/total_customers*100:.1f}%)")
    print(f"Generic names: {generic_names} ({generic_names/total_customers*100:.1f}%)")
    print()
    
    # Show loyalty level breakdown
    level_counts = {}
    for customer in customers:
        level = customer['loyalty_level']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print("Loyalty level breakdown:")
    for level in ['platinum', 'gold', 'silver', 'bronze']:
        if level in level_counts:
            count = level_counts[level]
            print(f"  {level.capitalize()}: {count} customers")

def show_business_opportunities(customers):
    """Show business opportunities based on customer names"""
    print("🚀 BUSINESS OPPORTUNITIES")
    print("=" * 30)
    print()
    
    # Count customers by loyalty level
    level_counts = {}
    for customer in customers:
        level = customer['loyalty_level']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print("Customer Recognition Opportunities:")
    print(f"  • {level_counts.get('platinum', 0)} Platinum customers need VIP treatment")
    print(f"  • {level_counts.get('gold', 0)} Gold customers for premium services")
    print(f"  • {level_counts.get('silver', 0)} Silver customers for upselling")
    print(f"  • {level_counts.get('bronze', 0)} Bronze customers for retention")
    print()
    
    print("Marketing Opportunities:")
    print("  • Personalize communications with real names")
    print("  • Create targeted campaigns by loyalty level")
    print("  • Implement referral programs")
    print("  • Set up loyalty point redemption")
    print("  • Track customer lifetime value")

def main():
    """Main function"""
    print("🎉 CUSTOMER NAMES SHOWCASE")
    print("=" * 35)
    print()
    
    # Load data
    customers = load_customer_data()
    if not customers:
        return
    
    # Show statistics
    show_name_statistics(customers)
    print()
    
    # Show customers with real names
    real_customers, generic_customers = show_customers_with_real_names(customers)
    print()
    
    # Show top customers
    show_top_customers_by_name(customers)
    print()
    
    # Show by loyalty level
    show_customers_by_loyalty_level(customers)
    print()
    
    # Show business opportunities
    show_business_opportunities(customers)
    
    print("✅ CUSTOMER NAMES ANALYSIS COMPLETE!")
    print("=" * 40)
    print()
    print("Your customer system has:")
    print(f"  • {len(real_customers)} customers with real names")
    print(f"  • {len(generic_customers)} customers with generic names")
    print("  • Complete loyalty level system")
    print("  • Ready for personalized marketing")
    print()
    print("🚀 Ready for advanced customer management!")

if __name__ == "__main__":
    main()
