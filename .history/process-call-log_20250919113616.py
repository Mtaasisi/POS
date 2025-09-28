#!/usr/bin/env python3
"""
Process Call Log CSV and Generate SQL
This script processes the call log CSV file and generates SQL to update customers
"""

import csv
import re
from datetime import datetime
from collections import defaultdict

def clean_name(name):
    """Clean customer name by removing everything after | and special characters"""
    if not name or name.strip() == '':
        return None
    
    # Remove everything after | and clean special characters
    clean = re.sub(r'\|.*$', '', name)
    clean = re.sub(r'[🤓🏀]', '', clean)
    clean = clean.strip()
    
    return clean if clean and clean != 'Unknown' else None

def standardize_phone(phone):
    """Standardize phone number to +255 format"""
    if not phone:
        return None
    
    phone = phone.strip()
    
    if phone.startswith('+255'):
        return phone
    elif phone.startswith('255'):
        return '+' + phone
    elif len(phone) == 9:
        return '+255' + phone
    elif len(phone) == 10 and phone.startswith('0'):
        return '+255' + phone[1:]
    else:
        return '+255' + phone

def parse_duration(duration_str):
    """Parse duration string to minutes"""
    if not duration_str or duration_str.strip() == '':
        return 0.0
    
    try:
        # Parse format like "00h 00m 04s"
        parts = duration_str.split()
        hours = 0
        minutes = 0
        seconds = 0
        
        for part in parts:
            if part.endswith('h'):
                hours = int(part[:-1])
            elif part.endswith('m'):
                minutes = int(part[:-1])
            elif part.endswith('s'):
                seconds = int(part[:-1])
        
        total_minutes = hours * 60 + minutes + seconds / 60
        return round(total_minutes, 2)
    except:
        return 0.0

def determine_loyalty_level(total_calls, total_duration):
    """Determine loyalty level based on call activity"""
    if total_calls >= 100 and total_duration >= 300:
        return 'VIP'
    elif total_calls >= 50 and total_duration >= 150:
        return 'Gold'
    elif total_calls >= 20 and total_duration >= 60:
        return 'Silver'
    elif total_calls >= 10 and total_duration >= 20:
        return 'Bronze'
    elif total_calls >= 5:
        return 'Basic'
    else:
        return 'New'

def process_call_log(csv_file_path):
    """Process the call log CSV file"""
    call_data = defaultdict(lambda: {
        'names': set(),
        'calls': [],
        'first_call': None,
        'last_call': None,
        'total_calls': 0,
        'incoming_calls': 0,
        'outgoing_calls': 0,
        'missed_calls': 0,
        'total_duration': 0.0
    })
    
    print(f"Processing {csv_file_path}...")
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            try:
                # Clean and standardize data
                name = clean_name(row.get('Name', ''))
                phone = standardize_phone(row.get('To Number', ''))
                call_datetime = datetime.strptime(row.get('Date Time', ''), '%Y-%m-%d %H:%M:%S')
                duration = parse_duration(row.get('Duration', ''))
                call_type = row.get('Type', '')
                
                if not phone:
                    continue
                
                # Store call data
                if name:
                    call_data[phone]['names'].add(name)
                
                call_data[phone]['calls'].append({
                    'datetime': call_datetime,
                    'duration': duration,
                    'type': call_type
                })
                
                # Update statistics
                call_data[phone]['total_calls'] += 1
                call_data[phone]['total_duration'] += duration
                
                if call_type == 'Incoming':
                    call_data[phone]['incoming_calls'] += 1
                elif call_type == 'Outgoing':
                    call_data[phone]['outgoing_calls'] += 1
                elif call_type == 'Missed':
                    call_data[phone]['missed_calls'] += 1
                
                # Update first and last call dates
                if call_data[phone]['first_call'] is None or call_datetime < call_data[phone]['first_call']:
                    call_data[phone]['first_call'] = call_datetime
                
                if call_data[phone]['last_call'] is None or call_datetime > call_data[phone]['last_call']:
                    call_data[phone]['last_call'] = call_datetime
                    
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
    
    print(f"Processed {len(call_data)} unique phone numbers")
    return call_data

def generate_sql(call_data):
    """Generate SQL to update customers"""
    sql_parts = []
    
    # Create temporary table
    sql_parts.append("-- Create temporary table with processed call log data")
    sql_parts.append("CREATE TEMP TABLE temp_call_log_processed AS")
    sql_parts.append("SELECT * FROM (VALUES")
    
    # Generate VALUES for each phone number
    values = []
    for phone, data in call_data.items():
        # Get the best name (longest, most descriptive)
        best_name = max(data['names'], key=len) if data['names'] else 'Unknown'
        best_name = best_name.replace("'", "''")  # Escape single quotes
        
        # Calculate average duration
        avg_duration = data['total_duration'] / data['total_calls'] if data['total_calls'] > 0 else 0
        
        # Determine loyalty level
        loyalty_level = determine_loyalty_level(data['total_calls'], data['total_duration'])
        
        # Format datetime
        first_call = data['first_call'].strftime('%Y-%m-%d %H:%M:%S') if data['first_call'] else None
        last_call = data['last_call'].strftime('%Y-%m-%d %H:%M:%S') if data['last_call'] else None
        
        values.append(f"('{phone}', '{best_name}', '{first_call}', '{last_call}', {data['total_calls']}, {data['incoming_calls']}, {data['outgoing_calls']}, {data['missed_calls']}, {data['total_duration']:.2f}, {avg_duration:.2f}, '{loyalty_level}')")
    
    sql_parts.append(",\n".join(values))
    sql_parts.append(") AS call_data(phone, best_name, first_call_date, last_call_date, total_calls, incoming_calls, outgoing_calls, missed_calls, total_duration_minutes, avg_duration_minutes, loyalty_level);")
    sql_parts.append("")
    
    # Add analysis queries
    sql_parts.append("-- Show analysis of call log data")
    sql_parts.append("SELECT 'Call Log Analysis:' as info, COUNT(*) as unique_phone_numbers FROM temp_call_log_processed;")
    sql_parts.append("")
    
    sql_parts.append("-- Show loyalty level distribution")
    sql_parts.append("SELECT loyalty_level, COUNT(*) as count FROM temp_call_log_processed GROUP BY loyalty_level ORDER BY count DESC;")
    sql_parts.append("")
    
    # Add update query
    sql_parts.append("-- Update existing customers with call log data")
    sql_parts.append("UPDATE customers SET")
    sql_parts.append("    name = CASE WHEN customers.name = '__' OR customers.name IS NULL OR LENGTH(t.best_name) > LENGTH(customers.name) THEN t.best_name ELSE customers.name END,")
    sql_parts.append("    created_at = COALESCE(t.first_call_date::timestamp, customers.created_at),")
    sql_parts.append("    total_calls = t.total_calls,")
    sql_parts.append("    total_call_duration_minutes = t.total_duration_minutes,")
    sql_parts.append("    incoming_calls = t.incoming_calls,")
    sql_parts.append("    outgoing_calls = t.outgoing_calls,")
    sql_parts.append("    missed_calls = t.missed_calls,")
    sql_parts.append("    avg_call_duration_minutes = t.avg_duration_minutes,")
    sql_parts.append("    first_call_date = t.first_call_date::timestamp,")
    sql_parts.append("    last_call_date = t.last_call_date::timestamp,")
    sql_parts.append("    call_loyalty_level = t.loyalty_level,")
    sql_parts.append("    last_visit = t.last_call_date::timestamp,")
    sql_parts.append("    updated_at = NOW()")
    sql_parts.append("FROM temp_call_log_processed t")
    sql_parts.append("WHERE customers.phone = t.phone;")
    sql_parts.append("")
    
    sql_parts.append("-- Show updated customers count")
    sql_parts.append("SELECT 'Updated customers:' as info, COUNT(*) as count FROM customers WHERE updated_at > NOW() - INTERVAL '1 minute';")
    
    return "\n".join(sql_parts)

def main():
    csv_file = "/Users/mtaasisi/Downloads/Call_Log_With_Names.csv"
    output_file = "/Users/mtaasisi/Desktop/LATS CHANCE copy/import-call-log-generated.sql"
    
    # Process the call log
    call_data = process_call_log(csv_file)
    
    # Generate SQL
    sql = generate_sql(call_data)
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"Generated SQL file: {output_file}")
    print(f"Processed {len(call_data)} unique phone numbers")
    
    # Show summary
    loyalty_counts = defaultdict(int)
    for data in call_data.values():
        loyalty_level = determine_loyalty_level(data['total_calls'], data['total_duration'])
        loyalty_counts[loyalty_level] += 1
    
    print("\nLoyalty Level Distribution:")
    for level, count in sorted(loyalty_counts.items(), key=lambda x: ['VIP', 'Gold', 'Silver', 'Bronze', 'Basic', 'New'].index(x[0])):
        print(f"  {level}: {count} customers")

if __name__ == "__main__":
    main()
