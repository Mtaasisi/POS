#!/usr/bin/env python3
"""
PDF to Excel Converter for Banking Documents
Converts CRDB BANK.pdf to Excel format
"""

import pdfplumber
import pandas as pd
import re
from datetime import datetime
import sys
import os

def extract_banking_data(pdf_path):
    """Extract banking data from PDF"""
    print(f"Processing PDF: {pdf_path}")
    
    all_data = []
    page_data = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Total pages: {len(pdf.pages)}")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Processing page {page_num}...")
                
                # Extract text from page
                text = page.extract_text()
                if text:
                    # Try to extract tables first
                    tables = page.extract_tables()
                    if tables:
                        for table in tables:
                            if table and len(table) > 1:  # Skip empty tables
                                # Convert table to DataFrame
                                df_table = pd.DataFrame(table[1:], columns=table[0])
                                all_data.append({
                                    'page': page_num,
                                    'type': 'table',
                                    'data': df_table
                                })
                    
                    # If no tables, try to parse text for banking patterns
                    if not tables:
                        lines = text.split('\n')
                        for line in lines:
                            line = line.strip()
                            if line:
                                # Look for banking patterns (dates, amounts, descriptions)
                                banking_patterns = [
                                    r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # Dates
                                    r'\d+\.\d{2}',  # Decimal amounts
                                    r'\d+,\d{3}',   # Comma-separated numbers
                                    r'CRDB|BANK|ACCOUNT|TRANSACTION',  # Bank keywords
                                ]
                                
                                if any(re.search(pattern, line, re.IGNORECASE) for pattern in banking_patterns):
                                    page_data.append({
                                        'page': page_num,
                                        'text': line
                                    })
                
                # Add page text data
                if page_data:
                    all_data.append({
                        'page': page_num,
                        'type': 'text',
                        'data': page_data.copy()
                    })
                    page_data.clear()
    
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return None
    
    return all_data

def create_excel_file(data, output_path):
    """Create Excel file from extracted data"""
    print(f"Creating Excel file: {output_path}")
    
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Create summary sheet
            summary_data = []
            for item in data:
                summary_data.append({
                    'Page': item['page'],
                    'Type': item['type'],
                    'Records': len(item['data']) if isinstance(item['data'], list) else item['data'].shape[0] if hasattr(item['data'], 'shape') else 1
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Create data sheets
            table_count = 0
            text_count = 0
            
            for item in data:
                if item['type'] == 'table':
                    table_count += 1
                    sheet_name = f'Table_{table_count}_Page_{item["page"]}'
                    item['data'].to_excel(writer, sheet_name=sheet_name, index=False)
                
                elif item['type'] == 'text':
                    text_count += 1
                    sheet_name = f'Text_{text_count}_Page_{item["page"]}'
                    text_df = pd.DataFrame(item['data'])
                    text_df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        print(f"Excel file created successfully: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error creating Excel file: {e}")
        return False

def main():
    """Main function"""
    pdf_path = "/Users/mtaasisi/Documents/Web Receipts/CRDB BANK.pdf"
    output_path = "/Users/mtaasisi/Documents/Web Receipts/CRDB_BANK_Data.xlsx"
    
    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}")
        return
    
    # Extract data from PDF
    data = extract_banking_data(pdf_path)
    if not data:
        print("No data extracted from PDF")
        return
    
    print(f"Extracted data from {len(data)} sections")
    
    # Create Excel file
    success = create_excel_file(data, output_path)
    if success:
        print(f"Conversion completed successfully!")
        print(f"Output file: {output_path}")
    else:
        print("Conversion failed")

if __name__ == "__main__":
    main()
