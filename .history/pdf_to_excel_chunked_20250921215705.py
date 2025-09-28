#!/usr/bin/env python3
"""
Memory-Efficient PDF to Excel Converter
Processes large PDFs in chunks to avoid memory issues
"""

import pdfplumber
import pandas as pd
import re
import os
import gc
from datetime import datetime

def process_pdf_in_chunks(pdf_path, chunk_size=10):
    """Process PDF in chunks to manage memory"""
    print(f"Processing PDF in chunks of {chunk_size} pages...")
    
    all_tables = []
    all_text = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")
            
            for start_page in range(0, total_pages, chunk_size):
                end_page = min(start_page + chunk_size, total_pages)
                print(f"Processing pages {start_page+1} to {end_page}...")
                
                # Process chunk of pages
                chunk_tables, chunk_text = process_page_chunk(pdf, start_page, end_page)
                all_tables.extend(chunk_tables)
                all_text.extend(chunk_text)
                
                # Force garbage collection
                gc.collect()
                
                print(f"Completed pages {start_page+1} to {end_page}")
    
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return None, None
    
    return all_tables, all_text

def process_page_chunk(pdf, start_page, end_page):
    """Process a chunk of pages"""
    tables = []
    text_data = []
    
    for page_num in range(start_page, end_page):
        try:
            page = pdf.pages[page_num]
            actual_page_num = page_num + 1
            
            # Extract tables
            page_tables = page.extract_tables()
            if page_tables:
                for i, table in enumerate(page_tables):
                    if table and len(table) > 1:
                        tables.append({
                            'page': actual_page_num,
                            'table_num': i + 1,
                            'data': table
                        })
            
            # Extract text
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and len(line) > 3:  # Skip very short lines
                        text_data.append({
                            'page': actual_page_num,
                            'text': line
                        })
        
        except Exception as e:
            print(f"Error processing page {page_num + 1}: {e}")
            continue
    
    return tables, text_data

def create_excel_from_chunks(tables, text_data, output_path):
    """Create Excel file from chunked data"""
    print(f"Creating Excel file: {output_path}")
    
    try:
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Create summary sheet
            summary_data = []
            
            if tables:
                summary_data.append({
                    'Type': 'Tables',
                    'Count': len(tables),
                    'Description': f'Found {len(tables)} tables across pages'
                })
            
            if text_data:
                summary_data.append({
                    'Type': 'Text Lines',
                    'Count': len(text_data),
                    'Description': f'Found {len(text_data)} text lines across pages'
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Create tables sheet
            if tables:
                table_records = []
                for table_info in tables:
                    for row_idx, row in enumerate(table_info['data']):
                        if row:  # Skip empty rows
                            record = {
                                'Page': table_info['page'],
                                'Table': table_info['table_num'],
                                'Row': row_idx + 1
                            }
                            # Add columns dynamically
                            for col_idx, cell in enumerate(row):
                                record[f'Column_{col_idx+1}'] = cell if cell else ''
                            table_records.append(record)
                
                if table_records:
                    tables_df = pd.DataFrame(table_records)
                    tables_df.to_excel(writer, sheet_name='Tables', index=False)
            
            # Create text sheet
            if text_data:
                text_df = pd.DataFrame(text_data)
                text_df.to_excel(writer, sheet_name='Text_Data', index=False)
        
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
    
    print("Starting memory-efficient PDF to Excel conversion...")
    
    # Process PDF in chunks
    tables, text_data = process_pdf_in_chunks(pdf_path, chunk_size=5)  # Smaller chunks
    
    if not tables and not text_data:
        print("No data extracted from PDF")
        return
    
    print(f"Extracted {len(tables)} tables and {len(text_data)} text lines")
    
    # Create Excel file
    success = create_excel_from_chunks(tables, text_data, output_path)
    if success:
        print(f"Conversion completed successfully!")
        print(f"Output file: {output_path}")
        
        # Show file size
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            print(f"Excel file size: {size / (1024*1024):.2f} MB")
    else:
        print("Conversion failed")

if __name__ == "__main__":
    main()
