#!/usr/bin/env python3
import pandas as pd
import re
import sys
from datetime import datetime

def extract_customer_data(filename):
    """Extract all customer data from the backup file"""
    print("🔄 Reading backup file...")
    
    with open(filename, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find the COPY statement and extract data
    print("🔍 Finding customer data section...")
    copy_match = re.search(r'COPY public\.customers.*?FROM stdin;\n(.*?)\n\\.', content, re.DOTALL)
    if not copy_match:
        print("❌ Could not find customer data in the file")
        return []
    
    data_section = copy_match.group(1)
    print(f"📋 Found customer data section ({len(data_section)} characters)")
    
    # Split by lines and parse each customer
    lines = data_section.strip().split('\n')
    print(f"📊 Processing {len(lines)} customer records...")
    
    customers = []
    processed = 0
    
    for line in lines:
        if not line.strip():
            continue
            
        # Split by tab character
        parts = line.split('\t')
        if len(parts) < 28:  # Expected number of columns
            continue
            
        try:
            customer = {
                'ID': parts[0].strip(),
                'Name': parts[1].strip(),
                'Email': parts[2].strip() if parts[2].strip() != '\\N' else '',
                'Phone': parts[3].strip(),
                'Gender': parts[4].strip() if parts[4].strip() != '\\N' else '',
                'City': parts[5].strip() if parts[5].strip() != '\\N' else '',
                'Location Description': parts[6].strip() if parts[6].strip() != '\\N' else '',
                'National ID': parts[7].strip() if parts[7].strip() != '\\N' else '',
                'Joined Date': parts[8].strip() if parts[8].strip() != '\\N' else '',
                'Loyalty Level': parts[9].strip(),
                'Color Tag': parts[10].strip(),
                'Referred By': parts[11].strip() if parts[11].strip() != '\\N' else '',
                'Total Spent': parts[12].strip(),
                'Points': parts[13].strip(),
                'Last Visit': parts[14].strip() if parts[14].strip() != '\\N' else '',
                'Is Active': parts[15].strip(),
                'Referrals': parts[16].strip(),
                'WhatsApp': parts[17].strip() if parts[17].strip() != '\\N' else '',
                'Referral Source': parts[18].strip() if parts[18].strip() != '\\N' else '',
                'Birth Month': parts[19].strip() if parts[19].strip() != '\\N' else '',
                'Birth Day': parts[20].strip() if parts[20].strip() != '\\N' else '',
                'Customer Tag': parts[21].strip() if parts[21].strip() != '\\N' else '',
                'Notes': parts[22].strip() if parts[22].strip() != '\\N' else '',
                'Total Returns': parts[23].strip(),
                'Profile Image': parts[24].strip() if parts[24].strip() != '\\N' else '',
                'Created At': parts[25].strip() if parts[25].strip() != '\\N' else '',
                'Updated At': parts[26].strip() if parts[26].strip() != '\\N' else '',
                'Initial Notes': parts[27].strip() if parts[27].strip() != '\\N' else '',
                'Created By': parts[28].strip() if len(parts) > 28 and parts[28].strip() != '\\N' else ''
            }
            customers.append(customer)
            processed += 1
            
            if processed % 1000 == 0:
                print(f"✅ Processed {processed} customers...")
                
        except Exception as e:
            print(f"⚠️ Error parsing line {processed + 1}: {e}")
            continue
    
    print(f"✅ Successfully processed {len(customers)} customers")
    return customers

def create_comprehensive_excel(customers, output_filename):
    """Create comprehensive Excel file with multiple sheets"""
    if not customers:
        print("❌ No customer data to export")
        return
    
    print("📊 Creating Excel file with multiple sheets...")
    
    # Create DataFrame
    df = pd.DataFrame(customers)
    
    # Convert numeric columns
    df['Points'] = pd.to_numeric(df['Points'], errors='coerce').fillna(0)
    df['Total Spent'] = pd.to_numeric(df['Total Spent'], errors='coerce').fillna(0)
    df['Total Returns'] = pd.to_numeric(df['Total Returns'], errors='coerce').fillna(0)
    
    # Create Excel writer
    with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
        
        # 1. All Customers Sheet
        print("📋 Creating 'All Customers' sheet...")
        all_customers_columns = [
            'Name', 'Phone', 'Email', 'WhatsApp', 'Gender', 'City', 
            'Loyalty Level', 'Points', 'Total Spent', 'Is Active',
            'Referral Source', 'Referred By', 'Joined Date', 'Last Visit',
            'Customer Tag', 'Notes', 'Birth Month', 'Birth Day',
            'ID', 'Created At', 'Updated At'
        ]
        
        available_columns = [col for col in all_customers_columns if col in df.columns]
        all_customers_df = df[available_columns]
        all_customers_df.to_excel(writer, sheet_name='All Customers', index=False)
        
        # 2. Active Customers Sheet
        print("📋 Creating 'Active Customers' sheet...")
        active_customers = df[df['Is Active'] == 't']
        active_customers[available_columns].to_excel(writer, sheet_name='Active Customers', index=False)
        
        # 3. Customers with Email Sheet
        print("📋 Creating 'Customers with Email' sheet...")
        customers_with_email = df[df['Email'] != '']
        customers_with_email[available_columns].to_excel(writer, sheet_name='Customers with Email', index=False)
        
        # 4. Customers with WhatsApp Sheet
        print("📋 Creating 'Customers with WhatsApp' sheet...")
        customers_with_whatsapp = df[df['WhatsApp'] != '']
        customers_with_whatsapp[available_columns].to_excel(writer, sheet_name='Customers with WhatsApp', index=False)
        
        # 5. Loyalty Customers Sheet (with points > 0)
        print("📋 Creating 'Loyalty Customers' sheet...")
        loyalty_customers = df[df['Points'] > 0].sort_values('Points', ascending=False)
        loyalty_customers[available_columns].to_excel(writer, sheet_name='Loyalty Customers', index=False)
        
        # 6. Summary Sheet
        print("📋 Creating 'Summary' sheet...")
        summary_data = {
            'Metric': [
                'Total Customers',
                'Active Customers',
                'Inactive Customers',
                'Customers with Email',
                'Customers with WhatsApp',
                'Customers with Points > 0',
                'Bronze Level Customers',
                'Silver Level Customers',
                'Gold Level Customers',
                'Platinum Level Customers',
                'Customers with Total Spent > 0',
                'Average Points per Customer',
                'Total Points Across All Customers',
                'Total Spent Across All Customers'
            ],
            'Count': [
                len(df),
                len(df[df['Is Active'] == 't']),
                len(df[df['Is Active'] == 'f']),
                len(df[df['Email'] != '']),
                len(df[df['WhatsApp'] != '']),
                len(df[df['Points'] > 0]),
                len(df[df['Loyalty Level'] == 'bronze']),
                len(df[df['Loyalty Level'] == 'silver']),
                len(df[df['Loyalty Level'] == 'gold']),
                len(df[df['Loyalty Level'] == 'platinum']),
                len(df[df['Total Spent'] > 0]),
                round(df['Points'].mean(), 2),
                df['Points'].sum(),
                round(df['Total Spent'].sum(), 2)
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # 7. Top Cities Sheet
        print("📋 Creating 'Top Cities' sheet...")
        city_stats = df['City'].value_counts().reset_index()
        city_stats.columns = ['City', 'Customer Count']
        city_stats.to_excel(writer, sheet_name='Top Cities', index=False)
        
        # 8. Referral Sources Sheet
        print("📋 Creating 'Referral Sources' sheet...")
        referral_stats = df['Referral Source'].value_counts().reset_index()
        referral_stats.columns = ['Referral Source', 'Customer Count']
        referral_stats.to_excel(writer, sheet_name='Referral Sources', index=False)
        
        # Format all sheets
        print("🎨 Formatting sheets...")
        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Comprehensive Excel file created successfully: {output_filename}")
    print(f"📊 Total customers exported: {len(customers)}")
    print(f"📋 Sheets created: All Customers, Active Customers, Customers with Email, Customers with WhatsApp, Loyalty Customers, Summary, Top Cities, Referral Sources")

def main():
    backup_file = "/Users/mtaasisi/Desktop/SQL/supabase_full_2025-08-08_09-48.sql"
    output_file = "LATS_Complete_Customer_Contacts.xlsx"
    
    print("🚀 Starting comprehensive customer data extraction...")
    customers = extract_customer_data(backup_file)
    
    if customers:
        print(f"📋 Found {len(customers)} customers")
        create_comprehensive_excel(customers, output_file)
        
        # Show some sample data
        print("\n📋 Sample customers:")
        for i, customer in enumerate(customers[:5]):
            print(f"{i+1}. {customer['Name']} - {customer['Phone']} - {customer['City']} - Points: {customer['Points']}")
    else:
        print("❌ No customer data found")

if __name__ == "__main__":
    main()
