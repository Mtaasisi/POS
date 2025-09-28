#!/usr/bin/env python3
"""
Export customer data to CSV format for easy viewing
"""
import json
import csv
from datetime import datetime

def export_customers_to_csv():
    """Export customer data to CSV file"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_transactions.json', 'r', encoding='utf-8') as f:
            customers = json.load(f)
    except FileNotFoundError:
        print("Customer data file not found. Please run extract_customer_transactions.py first.")
        return
    
    # Prepare data for CSV
    csv_data = []
    for phone, data in customers.items():
        if data['total_received'] > 0:  # Only include customers with payments
            csv_data.append({
                'Customer_Name': data['name'],
                'Phone_Number': phone,
                'Total_Spent_TSH': data['total_received'],
                'Transaction_Count': data['transaction_count'],
                'Average_Transaction_TSH': data['total_received'] // data['transaction_count'] if data['transaction_count'] > 0 else 0,
                'Total_Sent_TSH': data['total_sent']
            })
    
    # Sort by total spent (descending)
    csv_data.sort(key=lambda x: x['Total_Spent_TSH'], reverse=True)
    
    # Write to CSV
    csv_filename = '/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_spending_report.csv'
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Customer_Name', 'Phone_Number', 'Total_Spent_TSH', 'Transaction_Count', 'Average_Transaction_TSH', 'Total_Sent_TSH']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for row in csv_data:
            writer.writerow(row)
    
    print(f"Customer data exported to: {csv_filename}")
    print(f"Total customers exported: {len(csv_data)}")
    
    # Show summary
    total_revenue = sum(row['Total_Spent_TSH'] for row in csv_data)
    print(f"Total revenue from customers: TSh {total_revenue:,}")

if __name__ == "__main__":
    export_customers_to_csv()
