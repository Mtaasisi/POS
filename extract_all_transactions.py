#!/usr/bin/env python3
"""
Extract ALL customer transaction data from SMS backup file - Improved version
"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime
import json
from collections import defaultdict

def parse_all_transaction_patterns(body, date_str):
    """Parse ALL types of transaction messages"""
    transactions = []
    
    # Pattern 1: Standard TigoPesa received payments (with name)
    pattern1 = r'Umepokea malipo TSh ([\d,]+) kutoka kwa (\d+) - ([^.]+)'
    matches = re.findall(pattern1, body)
    for match in matches:
        amount = int(match[0].replace(',', ''))
        phone = match[1]
        name = match[2].strip()
        transactions.append({
            'type': 'received',
            'amount': amount,
            'phone': phone,
            'name': name,
            'date': date_str,
            'service': 'TigoPesa'
        })
    
    # Pattern 2: Cross-platform payments (Airtel Money, Halo Pesa, Vodacom, etc.)
    pattern2 = r'Umepokea malipo TSh ([\d,]+) kutoka kwa (\d+); ([^,]+)'
    matches = re.findall(pattern2, body)
    for match in matches:
        amount = int(match[0].replace(',', ''))
        phone = match[1]
        service = match[2].strip()
        # Extract name if available in service name
        name = service if service not in ['Vodacom - Tanzania', 'Airtel - Money', 'Halo - Pesa'] else 'Unknown'
        transactions.append({
            'type': 'received',
            'amount': amount,
            'phone': phone,
            'name': name,
            'date': date_str,
            'service': service
        })
    
    # Pattern 3: Sent payments to agents
    pattern3 = r'Umetuma pesa kwa Wakala - ([^,]+), kiasi TSh ([\d,]+)'
    matches = re.findall(pattern3, body)
    for match in matches:
        name = match[0].strip()
        amount = int(match[1].replace(',', ''))
        transactions.append({
            'type': 'sent',
            'amount': amount,
            'name': name,
            'phone': None,
            'date': date_str,
            'service': 'TigoPesa'
        })
    
    # Pattern 4: Completed payments
    pattern4 = r'Malipo yamekamilika\. Kiasi Tsh([\d,]+)'
    matches = re.findall(pattern4, body)
    for match in matches:
        amount = int(match.replace(',', ''))
        transactions.append({
            'type': 'completed',
            'amount': amount,
            'phone': None,
            'name': 'Unknown',
            'date': date_str,
            'service': 'TigoPesa'
        })
    
    # Pattern 5: Other payment patterns
    pattern5 = r'Umepokea malipo TSh ([\d,]+) kutoka kwa (\d+)'
    matches = re.findall(pattern5, body)
    for match in matches:
        amount = int(match[0].replace(',', ''))
        phone = match[1]
        # Skip if already captured by other patterns
        if not any(t['phone'] == phone and t['amount'] == amount for t in transactions):
            transactions.append({
                'type': 'received',
                'amount': amount,
                'phone': phone,
                'name': 'Unknown',
                'date': date_str,
                'service': 'TigoPesa'
            })
    
    return transactions

def extract_all_transactions_from_sms():
    """Extract ALL transactions from SMS XML file"""
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
        
        # Process TigoPesa messages
        if 'TIGOPESA' in address.upper() or 'Tigopesa' in address:
            transactions = parse_all_transaction_patterns(body, readable_date)
            all_transactions.extend(transactions)
    
    return all_transactions

def create_comprehensive_customer_database(transactions):
    """Create comprehensive customer database"""
    customers = defaultdict(lambda: {
        'name': '',
        'phone': '',
        'total_received': 0,
        'total_sent': 0,
        'transaction_count': 0,
        'transactions': [],
        'services_used': set()
    })
    
    for trans in transactions:
        if trans['type'] == 'received':
            # Use phone number as primary key
            key = trans['phone']
            customers[key]['phone'] = trans['phone']
            if trans['name'] != 'Unknown':
                customers[key]['name'] = trans['name']
            customers[key]['total_received'] += trans['amount']
            customers[key]['transaction_count'] += 1
            customers[key]['services_used'].add(trans['service'])
            customers[key]['transactions'].append(trans)
        
        elif trans['type'] == 'sent':
            # Use name as key for sent payments
            key = trans['name']
            customers[key]['name'] = trans['name']
            customers[key]['total_sent'] += trans['amount']
            customers[key]['transaction_count'] += 1
            customers[key]['services_used'].add(trans['service'])
            customers[key]['transactions'].append(trans)
    
    # Convert sets to lists for JSON serialization
    for customer in customers.values():
        customer['services_used'] = list(customer['services_used'])
    
    return dict(customers)

def generate_comprehensive_reports(customers):
    """Generate comprehensive customer spending reports"""
    
    # Filter customers with payments
    paying_customers = [(phone, data) for phone, data in customers.items() if data['total_received'] > 0]
    paying_customers.sort(key=lambda x: x[1]['total_received'], reverse=True)
    
    print("=== COMPREHENSIVE CUSTOMER ANALYSIS ===\n")
    print(f"Total customers in database: {len(customers)}")
    print(f"Customers with payments: {len(paying_customers)}")
    
    # Service breakdown
    service_stats = defaultdict(int)
    for data in customers.values():
        for service in data['services_used']:
            service_stats[service] += 1
    
    print(f"\nMobile Money Services Used:")
    for service, count in sorted(service_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {service}: {count} customers")
    
    print(f"\nTOP 30 CUSTOMERS BY TOTAL SPENT:")
    print("-" * 90)
    print(f"{'Rank':<4} {'Name':<25} {'Phone':<15} {'Total (TSH)':<15} {'Transactions':<12} {'Services':<15}")
    print("-" * 90)
    
    for i, (phone, data) in enumerate(paying_customers[:30], 1):
        total = data['total_received']
        name = data['name'][:24] if data['name'] else 'Unknown'
        phone_display = phone[:14] if phone else 'N/A'
        services = ', '.join(data['services_used'][:2])  # Show first 2 services
        if len(data['services_used']) > 2:
            services += f" +{len(data['services_used'])-2}"
        
        print(f"{i:<4} {name:<25} {phone_display:<15} {total:>12,} {data['transaction_count']:>10} {services:<15}")
    
    # Business summary
    total_received = sum(data['total_received'] for data in customers.values())
    total_sent = sum(data['total_sent'] for data in customers.values())
    total_transactions = sum(data['transaction_count'] for data in customers.values())
    
    print(f"\n=== BUSINESS SUMMARY ===")
    print(f"Total received from customers: TSh {total_received:,}")
    print(f"Total sent to agents/suppliers: TSh {total_sent:,}")
    print(f"Total transactions processed: {total_transactions}")
    print(f"Average transaction value: TSh {total_received // total_transactions if total_transactions > 0 else 0:,}")
    
    return {
        'paying_customers': paying_customers,
        'total_received': total_received,
        'total_sent': total_sent,
        'total_transactions': total_transactions,
        'customer_count': len(customers),
        'paying_customer_count': len(paying_customers)
    }

def save_comprehensive_data(customers, filename):
    """Save comprehensive customer data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(customers, f, indent=2, ensure_ascii=False)
    
    print(f"\nComprehensive customer data saved to: {filename}")

if __name__ == "__main__":
    print("Extracting ALL transaction data from SMS file...")
    transactions = extract_all_transactions_from_sms()
    print(f"Found {len(transactions)} transactions")
    
    print("\nCreating comprehensive customer database...")
    customers = create_comprehensive_customer_database(transactions)
    
    print("\nGenerating comprehensive reports...")
    reports = generate_comprehensive_reports(customers)
    
    # Save comprehensive data
    save_comprehensive_data(customers, '/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json')
    
    print("\nComprehensive analysis complete!")
