#!/usr/bin/env python3
"""
Extract customer transaction data from SMS backup file
"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime
import json
from collections import defaultdict

def parse_tigopesa_transaction(body, date_str):
    """Parse TigoPesa transaction messages"""
    transactions = []
    
    # Pattern for received payments (Umepokea malipo)
    received_pattern = r'Umepokea malipo TSh ([\d,]+) kutoka kwa (\d+) - ([^.]+)'
    match = re.search(received_pattern, body)
    if match:
        amount = int(match.group(1).replace(',', ''))
        phone = match.group(2)
        name = match.group(3).strip()
        transactions.append({
            'type': 'received',
            'amount': amount,
            'phone': phone,
            'name': name,
            'date': date_str
        })
    
    # Pattern for sent payments (Umetuma pesa)
    sent_pattern = r'Umetuma pesa kwa Wakala - ([^,]+), kiasi TSh ([\d,]+)'
    match = re.search(sent_pattern, body)
    if match:
        name = match.group(1).strip()
        amount = int(match.group(2).replace(',', ''))
        transactions.append({
            'type': 'sent',
            'amount': amount,
            'name': name,
            'phone': None,
            'date': date_str
        })
    
    # Pattern for completed payments (Malipo yamekamilika)
    completed_pattern = r'Malipo yamekamilika\. Kiasi Tsh([\d,]+)'
    match = re.search(completed_pattern, body)
    if match:
        amount = int(match.group(1).replace(',', ''))
        transactions.append({
            'type': 'completed',
            'amount': amount,
            'phone': None,
            'name': 'Unknown',
            'date': date_str
        })
    
    return transactions

def extract_transactions_from_sms():
    """Extract all transactions from SMS XML file"""
    sms_file = '/Users/mtaasisi/Downloads/sms-20250919010749.xml'
    
    try:
        tree = ET.parse(sms_file)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML file: {e}")
        return []
    
    all_transactions = []
    
    for sms in root.findall('sms'):
        address = sms.get('address', '')
        body = sms.get('body', '')
        readable_date = sms.get('readable_date', '')
        
        # Only process TigoPesa messages
        if 'TIGOPESA' in address.upper() or 'Tigopesa' in address:
            transactions = parse_tigopesa_transaction(body, readable_date)
            all_transactions.extend(transactions)
    
    return all_transactions

def create_customer_database(transactions):
    """Create customer database with spending totals"""
    customers = defaultdict(lambda: {
        'name': '',
        'phone': '',
        'total_received': 0,
        'total_sent': 0,
        'transaction_count': 0,
        'transactions': []
    })
    
    for trans in transactions:
        if trans['type'] == 'received':
            # Use phone number as key for received payments
            key = trans['phone']
            customers[key]['phone'] = trans['phone']
            customers[key]['name'] = trans['name']
            customers[key]['total_received'] += trans['amount']
            customers[key]['transaction_count'] += 1
            customers[key]['transactions'].append(trans)
        
        elif trans['type'] == 'sent':
            # Use name as key for sent payments
            key = trans['name']
            customers[key]['name'] = trans['name']
            customers[key]['total_sent'] += trans['amount']
            customers[key]['transaction_count'] += 1
            customers[key]['transactions'].append(trans)
    
    return dict(customers)

def generate_reports(customers):
    """Generate customer spending reports"""
    
    # Top customers by received amount
    top_customers = sorted(
        [(phone, data) for phone, data in customers.items() if data['total_received'] > 0],
        key=lambda x: x[1]['total_received'],
        reverse=True
    )
    
    print("=== CUSTOMER SPENDING ANALYSIS ===\n")
    print(f"Total customers: {len(customers)}")
    print(f"Customers with payments: {len([c for c in customers.values() if c['total_received'] > 0])}\n")
    
    print("TOP 20 CUSTOMERS BY TOTAL SPENT:")
    print("-" * 80)
    print(f"{'Rank':<4} {'Name':<25} {'Phone':<15} {'Total (TSH)':<15} {'Transactions':<12}")
    print("-" * 80)
    
    for i, (phone, data) in enumerate(top_customers[:20], 1):
        total = data['total_received']
        name = data['name'][:24] if data['name'] else 'Unknown'
        phone_display = phone[:14] if phone else 'N/A'
        print(f"{i:<4} {name:<25} {phone_display:<15} {total:>12,} {data['transaction_count']:>10}")
    
    # Total business volume
    total_received = sum(data['total_received'] for data in customers.values())
    total_sent = sum(data['total_sent'] for data in customers.values())
    
    print(f"\n=== BUSINESS SUMMARY ===")
    print(f"Total received from customers: TSh {total_received:,}")
    print(f"Total sent to agents/suppliers: TSh {total_sent:,}")
    print(f"Net business volume: TSh {total_received - total_sent:,}")
    
    return {
        'top_customers': top_customers,
        'total_received': total_received,
        'total_sent': total_sent,
        'customer_count': len(customers)
    }

def save_to_json(customers, filename):
    """Save customer data to JSON file"""
    # Convert to serializable format
    serializable_customers = {}
    for phone, data in customers.items():
        serializable_customers[phone] = {
            'name': data['name'],
            'phone': data['phone'],
            'total_received': data['total_received'],
            'total_sent': data['total_sent'],
            'transaction_count': data['transaction_count'],
            'transactions': data['transactions']
        }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(serializable_customers, f, indent=2, ensure_ascii=False)
    
    print(f"\nCustomer data saved to: {filename}")

if __name__ == "__main__":
    print("Extracting transaction data from SMS file...")
    transactions = extract_transactions_from_sms()
    print(f"Found {len(transactions)} transactions")
    
    print("\nCreating customer database...")
    customers = create_customer_database(transactions)
    
    print("\nGenerating reports...")
    reports = generate_reports(customers)
    
    # Save to JSON file
    save_to_json(customers, '/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_transactions.json')
    
    print("\nAnalysis complete!")
