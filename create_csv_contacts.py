#!/usr/bin/env python3
import pandas as pd
import re
import csv

def extract_customer_data(filename):
    """Extract all customer data from the backup file"""
    print("🔄 Reading backup file...")
    
    with open(filename, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find the COPY statement and extract data
    copy_match = re.search(r'COPY public\.customers.*?FROM stdin;\n(.*?)\n\\.', content, re.DOTALL)
    if not copy_match:
        print("❌ Could not find customer data in the file")
        return []
    
    data_section = copy_match.group(1)
    lines = data_section.strip().split('\n')
    print(f"📊 Processing {len(lines)} customer records...")
    
    customers = []
    
    for line in lines:
        if not line.strip():
            continue
            
        parts = line.split('\t')
        if len(parts) < 28:
            continue
            
        try:
            customer = {
                'Name': parts[1].strip(),
                'Phone': parts[3].strip(),
                'Email': parts[2].strip() if parts[2].strip() != '\\N' else '',
                'WhatsApp': parts[17].strip() if parts[17].strip() != '\\N' else '',
                'Gender': parts[4].strip() if parts[4].strip() != '\\N' else '',
                'City': parts[5].strip() if parts[5].strip() != '\\N' else '',
                'Loyalty Level': parts[9].strip(),
                'Points': parts[13].strip(),
                'Total Spent': parts[12].strip(),
                'Is Active': parts[15].strip(),
                'Referral Source': parts[18].strip() if parts[18].strip() != '\\N' else '',
                'Joined Date': parts[8].strip() if parts[8].strip() != '\\N' else '',
                'Last Visit': parts[14].strip() if parts[14].strip() != '\\N' else '',
                'Customer Tag': parts[21].strip() if parts[21].strip() != '\\N' else '',
                'Notes': parts[22].strip() if parts[22].strip() != '\\N' else '',
                'Birth Month': parts[19].strip() if parts[19].strip() != '\\N' else '',
                'Birth Day': parts[20].strip() if parts[20].strip() != '\\N' else '',
                'ID': parts[0].strip()
            }
            customers.append(customer)
                
        except Exception as e:
            continue
    
    return customers

def create_csv_file(customers, output_filename):
    """Create CSV file with customer contacts"""
    if not customers:
        print("❌ No customer data to export")
        return
    
    # Define columns for CSV
    columns = [
        'Name', 'Phone', 'Email', 'WhatsApp', 'Gender', 'City', 
        'Loyalty Level', 'Points', 'Total Spent', 'Is Active',
        'Referral Source', 'Joined Date', 'Last Visit', 'Customer Tag', 
        'Notes', 'Birth Month', 'Birth Day', 'ID'
    ]
    
    with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=columns)
        writer.writeheader()
        
        for customer in customers:
            # Only include columns that exist
            row = {col: customer.get(col, '') for col in columns}
            writer.writerow(row)
    
    print(f"✅ CSV file created successfully: {output_filename}")
    print(f"📊 Total customers exported: {len(customers)}")

def main():
    backup_file = "/Users/mtaasisi/Desktop/SQL/supabase_full_2025-08-08_09-48.sql"
    output_file = "LATS_Customer_Contacts.csv"
    
    print("🚀 Creating CSV file with customer contacts...")
    customers = extract_customer_data(backup_file)
    
    if customers:
        print(f"📋 Found {len(customers)} customers")
        create_csv_file(customers, output_file)
        
        # Show some sample data
        print("\n📋 Sample customers:")
        for i, customer in enumerate(customers[:5]):
            print(f"{i+1}. {customer['Name']} - {customer['Phone']} - {customer['City']}")
    else:
        print("❌ No customer data found")

if __name__ == "__main__":
    main()
