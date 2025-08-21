#!/usr/bin/env python3
"""
Script to copy mobile numbers from Phone column to WhatsApp column
in the LATS Customer Contacts CSV file.
"""

import pandas as pd
import re

def clean_phone_number(phone):
    """Clean and standardize phone number format"""
    if pd.isna(phone) or phone == '':
        return ''
    
    # Convert to string
    phone = str(phone).strip()
    
    # Remove any non-digit characters except +
    phone = re.sub(r'[^\d+]', '', phone)
    
    # If it starts with 0, replace with +255
    if phone.startswith('0'):
        phone = '+255' + phone[1:]
    
    # If it doesn't start with +, add +255
    if not phone.startswith('+'):
        if len(phone) == 9:  # Local format
            phone = '+255' + phone
        elif len(phone) == 12 and phone.startswith('255'):  # International format without +
            phone = '+' + phone
    
    return phone

def copy_phone_to_whatsapp():
    """Copy phone numbers to WhatsApp column where WhatsApp is empty"""
    
    # Read the CSV file
    print("Reading LATS_Customer_Contacts.csv...")
    df = pd.read_csv('LATS_Customer_Contacts.csv')
    
    print(f"Total customers: {len(df)}")
    
    # Count customers with phone numbers
    customers_with_phone = df['Phone'].notna() & (df['Phone'] != '')
    print(f"Customers with phone numbers: {customers_with_phone.sum()}")
    
    # Count customers with WhatsApp numbers
    customers_with_whatsapp = df['WhatsApp'].notna() & (df['WhatsApp'] != '')
    print(f"Customers with WhatsApp numbers: {customers_with_whatsapp.sum()}")
    
    # Count customers with phone but no WhatsApp
    customers_needing_whatsapp = customers_with_phone & ~customers_with_whatsapp
    print(f"Customers with phone but no WhatsApp: {customers_needing_whatsapp.sum()}")
    
    # Create a backup
    backup_filename = 'LATS_Customer_Contacts_backup.csv'
    df.to_csv(backup_filename, index=False)
    print(f"Backup created: {backup_filename}")
    
    # Copy phone numbers to WhatsApp where WhatsApp is empty
    copy_count = 0
    for index, row in df.iterrows():
        phone = row['Phone']
        whatsapp = row['WhatsApp']
        
        # If customer has a phone number but no WhatsApp number
        if pd.notna(phone) and phone != '' and (pd.isna(whatsapp) or whatsapp == ''):
            cleaned_phone = clean_phone_number(phone)
            if cleaned_phone:  # Only copy if we have a valid phone number
                df.at[index, 'WhatsApp'] = cleaned_phone
                copy_count += 1
                print(f"Copied: {row['Name']} - {phone} -> {cleaned_phone}")
    
    print(f"\nTotal numbers copied: {copy_count}")
    
    # Save the updated file
    df.to_csv('LATS_Customer_Contacts.csv', index=False)
    print("Updated LATS_Customer_Contacts.csv saved successfully!")
    
    # Show final statistics
    final_customers_with_whatsapp = df['WhatsApp'].notna() & (df['WhatsApp'] != '')
    print(f"Final customers with WhatsApp numbers: {final_customers_with_whatsapp.sum()}")
    
    return df

if __name__ == "__main__":
    try:
        updated_df = copy_phone_to_whatsapp()
        print("\n✅ Phone to WhatsApp copy operation completed successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Please check if the CSV file exists and is accessible.")
