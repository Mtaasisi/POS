#!/usr/bin/env python3
"""
WhatsApp CRM Customer Extraction Script
Extracts and processes customer data from WhatsApp CSV export
"""

import pandas as pd
import sqlite3
import re
from datetime import datetime
import json
from collections import Counter

class WhatsAppCRMProcessor:
    def __init__(self, csv_file_path, db_path):
        self.csv_file_path = csv_file_path
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        
    def load_data(self):
        """Load WhatsApp CSV data"""
        print("Loading WhatsApp data...")
        self.df = pd.read_csv(self.csv_file_path)
        print(f"Loaded {len(self.df)} messages")
        
    def extract_customers(self):
        """Extract unique customers from the data"""
        print("Extracting customers...")
        
        # Get unique customers with phone numbers
        customers = self.df[self.df['Sender ID'].notna() & (self.df['Sender ID'] != '')].copy()
        
        customer_data = []
        for phone, group in customers.groupby('Sender ID'):
            name = group['Sender Name'].iloc[0] if pd.notna(group['Sender Name'].iloc[0]) else ''
            chat_sessions = group['Chat Session'].unique().tolist()
            
            # Determine customer type
            customer_type = self._determine_customer_type(name, chat_sessions)
            
            # Determine segment
            segment = self._determine_segment(len(group), chat_sessions)
            
            # Extract location
            location = self._extract_location(name, chat_sessions)
            
            # Get message dates
            dates = pd.to_datetime(group['Message Date'], errors='coerce')
            first_contact = dates.min()
            last_contact = dates.max()
            
            customer_data.append({
                'phone_number': phone,
                'name': name,
                'business_name': self._extract_business_name(name, chat_sessions),
                'location': location,
                'customer_type': customer_type,
                'segment': segment,
                'total_messages': len(group),
                'last_contact_date': last_contact,
                'first_contact_date': first_contact,
                'preferred_products': self._extract_preferred_products(group),
                'notes': f"Chat sessions: {', '.join(chat_sessions[:3])}"
            })
        
        return pd.DataFrame(customer_data)
    
    def _determine_customer_type(self, name, chat_sessions):
        """Determine if customer is individual, business, or group"""
        business_keywords = ['store', 'shop', 'group', 'business', 'company', 'ltd', 'corp']
        group_keywords = ['group', 'team', 'family']
        
        name_lower = name.lower()
        sessions_lower = ' '.join(chat_sessions).lower()
        
        if any(keyword in name_lower or keyword in sessions_lower for keyword in group_keywords):
            return 'group'
        elif any(keyword in name_lower or keyword in sessions_lower for keyword in business_keywords):
            return 'business'
        else:
            return 'individual'
    
    def _determine_segment(self, message_count, chat_sessions):
        """Determine customer segment based on activity"""
        if message_count > 1000:
            return 'vip'
        elif message_count > 100:
            return 'regular'
        elif message_count > 10:
            return 'prospect'
        else:
            return 'inactive'
    
    def _extract_location(self, name, chat_sessions):
        """Extract location from name or chat sessions"""
        locations = ['dar', 'arusha', 'dodoma', 'mwanza', 'mbeya', 'tanga', 'morogoro', 'dubai']
        
        text = (name + ' ' + ' '.join(chat_sessions)).lower()
        for location in locations:
            if location in text:
                return location.title()
        return 'Unknown'
    
    def _extract_business_name(self, name, chat_sessions):
        """Extract business name from chat sessions"""
        business_sessions = [session for session in chat_sessions 
                           if any(keyword in session.lower() 
                                for keyword in ['store', 'shop', 'business', 'group', 'company'])]
        return business_sessions[0] if business_sessions else name
    
    def _extract_preferred_products(self, customer_messages):
        """Extract preferred products from customer messages"""
        product_keywords = {
            'electronics': ['phone', 'iphone', 'laptop', 'camera', 'computer', 'tablet'],
            'fashion': ['clothes', 'shoes', 'dress', 'shirt', 'pants'],
            'health': ['medicine', 'supplement', 'vitamin', 'herbal'],
            'automotive': ['car', 'vehicle', 'motorcycle', 'bike'],
            'real_estate': ['house', 'apartment', 'property', 'land']
        }
        
        messages_text = ' '.join(customer_messages['Text'].fillna('').astype(str))
        messages_lower = messages_text.lower()
        
        preferred = []
        for category, keywords in product_keywords.items():
            if any(keyword in messages_lower for keyword in keywords):
                preferred.append(category)
        
        return ', '.join(preferred) if preferred else 'General'
    
    def process_messages(self):
        """Process and categorize messages"""
        print("Processing messages...")
        
        messages_data = []
        for _, row in self.df.iterrows():
            if pd.notna(row['Sender ID']) and row['Sender ID'] != '':
                messages_data.append({
                    'phone_number': row['Sender ID'],
                    'message_date': row['Message Date'],
                    'message_type': row['Type'].lower() if pd.notna(row['Type']) else 'unknown',
                    'message_text': row['Text'] if pd.notna(row['Text']) else '',
                    'chat_session': row['Chat Session'],
                    'attachment_type': row['Attachment type'] if pd.notna(row['Attachment type']) else '',
                    'attachment_info': row['Attachment info'] if pd.notna(row['Attachment info']) else '',
                    'status': row['Status'] if pd.notna(row['Status']) else ''
                })
        
        return pd.DataFrame(messages_data)
    
    def save_to_database(self, customers_df, messages_df):
        """Save processed data to SQLite database"""
        print("Saving to database...")
        
        # Save customers
        customers_df.to_sql('customers', self.conn, if_exists='replace', index=False)
        
        # Save messages
        messages_df.to_sql('messages', self.conn, if_exists='replace', index=False)
        
        # Create indexes
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone_number)")
        
        self.conn.commit()
        print("Data saved successfully!")
    
    def generate_reports(self):
        """Generate customer analysis reports"""
        print("Generating reports...")
        
        # Customer segmentation report
        segment_report = pd.read_sql("""
            SELECT segment, COUNT(*) as customer_count, 
                   AVG(total_messages) as avg_messages,
                   SUM(total_messages) as total_messages
            FROM customers 
            GROUP BY segment 
            ORDER BY customer_count DESC
        """, self.conn)
        
        # Location analysis
        location_report = pd.read_sql("""
            SELECT location, COUNT(*) as customer_count,
                   AVG(total_messages) as avg_messages
            FROM customers 
            WHERE location != 'Unknown'
            GROUP BY location 
            ORDER BY customer_count DESC
        """, self.conn)
        
        # Top customers by message volume
        top_customers = pd.read_sql("""
            SELECT name, phone_number, total_messages, segment, location
            FROM customers 
            ORDER BY total_messages DESC 
            LIMIT 20
        """, self.conn)
        
        # Save reports
        segment_report.to_csv('crm_system/reports/customer_segments.csv', index=False)
        location_report.to_csv('crm_system/reports/location_analysis.csv', index=False)
        top_customers.to_csv('crm_system/reports/top_customers.csv', index=False)
        
        print("Reports generated successfully!")
        
        return {
            'segment_report': segment_report,
            'location_report': location_report,
            'top_customers': top_customers
        }
    
    def close(self):
        """Close database connection"""
        self.conn.close()

def main():
    # Initialize processor
    processor = WhatsAppCRMProcessor(
        '/Users/mtaasisi/Documents/all whatsapp.csv',
        '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db'
    )
    
    try:
        # Process data
        processor.load_data()
        customers_df = processor.extract_customers()
        messages_df = processor.process_messages()
        
        # Save to database
        processor.save_to_database(customers_df, messages_df)
        
        # Generate reports
        reports = processor.generate_reports()
        
        print("\n=== CRM PROCESSING COMPLETE ===")
        print(f"Total customers processed: {len(customers_df)}")
        print(f"Total messages processed: {len(messages_df)}")
        
    finally:
        processor.close()

if __name__ == "__main__":
    main()
