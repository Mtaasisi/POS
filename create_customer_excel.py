#!/usr/bin/env python3
import pandas as pd
import re
import sys
from datetime import datetime

def parse_customer_data(filename):
    """Parse customer data from the backup file"""
    customers = []
    
    with open(filename, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find the COPY statement and extract data
    copy_match = re.search(r'COPY public\.customers.*?FROM stdin;\n(.*?)\n\\.', content, re.DOTALL)
    if not copy_match:
        print("Could not find customer data in the file")
        return []
    
    data_section = copy_match.group(1)
    
    # Split by lines and parse each customer
    lines = data_section.strip().split('\n')
    
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
        except Exception as e:
            print(f"Error parsing line: {line[:100]}... Error: {e}")
            continue
    
    return customers

def create_excel_file(customers, output_filename):
    """Create Excel file with customer data"""
    if not customers:
        print("No customer data to export")
        return
    
    # Create DataFrame
    df = pd.DataFrame(customers)
    
    # Reorder columns for better readability
    column_order = [
        'Name', 'Phone', 'Email', 'WhatsApp', 'Gender', 'City', 
        'Loyalty Level', 'Points', 'Total Spent', 'Is Active',
        'Referral Source', 'Referred By', 'Joined Date', 'Last Visit',
        'Customer Tag', 'Notes', 'Birth Month', 'Birth Day',
        'ID', 'Created At', 'Updated At'
    ]
    
    # Only include columns that exist in the data
    available_columns = [col for col in column_order if col in df.columns]
    df = df[available_columns]
    
    # Create Excel writer with formatting
    with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
        # Write main data
        df.to_excel(writer, sheet_name='All Customers', index=False)
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['All Customers']
        
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
        
        # Add summary sheet
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
                'Top Cities',
                'Top Referral Sources'
            ],
            'Count': [
                len(df),
                len(df[df['Is Active'] == 't']),
                len(df[df['Is Active'] == 'f']),
                len(df[df['Email'] != '']),
                len(df[df['WhatsApp'] != '']),
                len(df[df['Points'].astype(int) > 0]),
                len(df[df['Loyalty Level'] == 'bronze']),
                len(df[df['Loyalty Level'] == 'silver']),
                len(df[df['Loyalty Level'] == 'gold']),
                len(df[df['Loyalty Level'] == 'platinum']),
                df['City'].value_counts().head(3).to_string(),
                df['Referral Source'].value_counts().head(5).to_string()
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Format summary sheet
        summary_worksheet = writer.sheets['Summary']
        for column in summary_worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            
            adjusted_width = min(max_length + 2, 50)
            summary_worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Excel file created successfully: {output_filename}")
    print(f"📊 Total customers exported: {len(customers)}")

def main():
    backup_file = "/Users/mtaasisi/Desktop/SQL/supabase_full_2025-08-08_09-48.sql"
    output_file = "LATS_Customer_Contacts.xlsx"
    
    print("🔄 Parsing customer data from backup...")
    customers = parse_customer_data(backup_file)
    
    if customers:
        print(f"📋 Found {len(customers)} customers")
        print("📊 Creating Excel file...")
        create_excel_file(customers, output_file)
        
        # Show some sample data
        print("\n📋 Sample customers:")
        for i, customer in enumerate(customers[:5]):
            print(f"{i+1}. {customer['Name']} - {customer['Phone']} - {customer['City']}")
    else:
        print("❌ No customer data found")

if __name__ == "__main__":
    main()
