#!/usr/bin/env python3
"""
Detailed customer analysis and transaction history
"""
import json
from datetime import datetime

def load_customer_data():
    """Load customer data from JSON file"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_transactions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Customer data file not found. Please run extract_customer_transactions.py first.")
        return None

def show_customer_details(customers, limit=10):
    """Show detailed information for top customers"""
    # Sort customers by total received
    sorted_customers = sorted(
        [(phone, data) for phone, data in customers.items() if data['total_received'] > 0],
        key=lambda x: x[1]['total_received'],
        reverse=True
    )
    
    print("=== DETAILED CUSTOMER ANALYSIS ===\n")
    
    for i, (phone, data) in enumerate(sorted_customers[:limit], 1):
        print(f"{'='*60}")
        print(f"CUSTOMER #{i}")
        print(f"{'='*60}")
        print(f"Name: {data['name']}")
        print(f"Phone: {phone}")
        print(f"Total Spent: TSh {data['total_received']:,}")
        print(f"Number of Transactions: {data['transaction_count']}")
        print(f"Average per Transaction: TSh {data['total_received'] // data['transaction_count']:,}")
        
        if data['transactions']:
            print(f"\nTransaction History:")
            print("-" * 50)
            for j, trans in enumerate(data['transactions'], 1):
                if trans['type'] == 'received':
                    print(f"{j:2d}. {trans['date']} - TSh {trans['amount']:,} (Payment received)")
        
        print()

def show_business_insights(customers):
    """Show business insights and analytics"""
    total_customers = len([c for c in customers.values() if c['total_received'] > 0])
    total_received = sum(data['total_received'] for data in customers.values())
    total_transactions = sum(data['transaction_count'] for data in customers.values())
    
    # Calculate average spending
    avg_spending = total_received / total_customers if total_customers > 0 else 0
    avg_transaction = total_received / total_transactions if total_transactions > 0 else 0
    
    print("=== BUSINESS INSIGHTS ===\n")
    print(f"Total Active Customers: {total_customers}")
    print(f"Total Revenue: TSh {total_received:,}")
    print(f"Total Transactions: {total_transactions}")
    print(f"Average Customer Value: TSh {avg_spending:,.0f}")
    print(f"Average Transaction Value: TSh {avg_transaction:,.0f}")
    
    # Customer segments
    high_value = len([c for c in customers.values() if c['total_received'] >= 1000000])
    medium_value = len([c for c in customers.values() if 500000 <= c['total_received'] < 1000000])
    low_value = len([c for c in customers.values() if 0 < c['total_received'] < 500000])
    
    print(f"\nCustomer Segments:")
    print(f"High Value (TSh 1M+): {high_value} customers")
    print(f"Medium Value (TSh 500K-1M): {medium_value} customers")
    print(f"Low Value (<TSh 500K): {low_value} customers")

def search_customer(customers, search_term):
    """Search for a specific customer"""
    search_term = search_term.lower()
    found_customers = []
    
    for phone, data in customers.items():
        if (search_term in data['name'].lower() or 
            search_term in phone or 
            search_term in str(data['phone']).lower()):
            found_customers.append((phone, data))
    
    if found_customers:
        print(f"Found {len(found_customers)} customer(s) matching '{search_term}':\n")
        for phone, data in found_customers:
            print(f"Name: {data['name']}")
            print(f"Phone: {phone}")
            print(f"Total Spent: TSh {data['total_received']:,}")
            print(f"Transactions: {data['transaction_count']}")
            print("-" * 40)
    else:
        print(f"No customers found matching '{search_term}'")

def main():
    customers = load_customer_data()
    if not customers:
        return
    
    while True:
        print("\n" + "="*60)
        print("CUSTOMER DATABASE MENU")
        print("="*60)
        print("1. Show top 10 customers")
        print("2. Show top 20 customers")
        print("3. Show business insights")
        print("4. Search customer")
        print("5. Exit")
        print("-" * 60)
        
        choice = input("Enter your choice (1-5): ").strip()
        
        if choice == '1':
            show_customer_details(customers, 10)
        elif choice == '2':
            show_customer_details(customers, 20)
        elif choice == '3':
            show_business_insights(customers)
        elif choice == '4':
            search_term = input("Enter customer name or phone number: ").strip()
            if search_term:
                search_customer(customers, search_term)
        elif choice == '5':
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
