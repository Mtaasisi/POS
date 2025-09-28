#!/usr/bin/env python3
"""
WhatsApp CRM Setup Script
Complete setup and initialization of the CRM system
"""

import os
import sys
import sqlite3
import subprocess
from pathlib import Path

def setup_database():
    """Initialize the CRM database"""
    print("🗄️ Setting up CRM database...")
    
    db_path = '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db'
    schema_path = '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm_schema.sql'
    
    # Create database
    conn = sqlite3.connect(db_path)
    
    # Read and execute schema
    with open(schema_path, 'r') as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.commit()
    conn.close()
    
    print("✅ Database setup complete!")

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing dependencies...")
    
    packages = [
        'pandas',
        'plotly',
        'streamlit',
        'sqlite3'
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"⚠️ Failed to install {package}")

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    base_path = Path('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system')
    directories = [
        'reports',
        'exports',
        'backups',
        'logs'
    ]
    
    for directory in directories:
        dir_path = base_path / directory
        dir_path.mkdir(exist_ok=True)
        print(f"✅ Created {directory}/")

def run_customer_extraction():
    """Run customer data extraction"""
    print("👥 Extracting customer data...")
    
    try:
        # Import and run the extraction script
        sys.path.append('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/scripts')
        from extract_customers import main as extract_main
        extract_main()
        print("✅ Customer extraction complete!")
    except Exception as e:
        print(f"⚠️ Customer extraction failed: {e}")

def create_sample_data():
    """Create sample data for testing"""
    print("📊 Creating sample data...")
    
    db_path = '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db'
    conn = sqlite3.connect(db_path)
    
    # Sample products
    products = [
        ('iPhone 15', 'Electronics', 1200000, 10, 'Latest iPhone model'),
        ('Samsung Galaxy S24', 'Electronics', 1000000, 15, 'Premium Android phone'),
        ('MacBook Pro', 'Electronics', 2500000, 5, 'Professional laptop'),
        ('Canon Camera', 'Electronics', 800000, 8, 'Professional camera'),
        ('Nike Shoes', 'Fashion', 150000, 20, 'Comfortable running shoes')
    ]
    
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO products (name, category, price, stock_quantity, description)
        VALUES (?, ?, ?, ?, ?)
    """, products)
    
    # Sample automated responses
    responses = [
        ('["bei", "price", "cost"]', 'Bei ya {product} ni {price}. Je, ungependa maelezo zaidi?', 'text'),
        ('["ipo", "inapatikana", "stock"]', 'Ndiyo, {product} ipo stock. Tuna {quantity} pieces.', 'text'),
        ('["delivery", "tuma", "safiri"]', 'Tunafanya delivery kote Tanzania. Gharama ni {delivery_cost}.', 'text')
    ]
    
    cursor.executemany("""
        INSERT INTO automated_responses (trigger_keywords, response_text, response_type)
        VALUES (?, ?, ?)
    """, responses)
    
    conn.commit()
    conn.close()
    
    print("✅ Sample data created!")

def create_launch_scripts():
    """Create launch scripts for easy access"""
    print("🚀 Creating launch scripts...")
    
    # Dashboard launch script
    dashboard_script = '''#!/bin/bash
cd "/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system"
streamlit run dashboards/crm_dashboard.py --server.port 8501
'''
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/launch_dashboard.sh', 'w') as f:
        f.write(dashboard_script)
    
    os.chmod('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/launch_dashboard.sh', 0o755)
    
    # Automation test script
    automation_script = '''#!/bin/bash
cd "/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system"
python3 automation/marketing_automation.py
'''
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/test_automation.sh', 'w') as f:
        f.write(automation_script)
    
    os.chmod('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/test_automation.sh', 0o755)
    
    print("✅ Launch scripts created!")

def create_documentation():
    """Create system documentation"""
    print("📚 Creating documentation...")
    
    readme_content = '''# WhatsApp CRM System

## Overview
Complete Customer Relationship Management system built from WhatsApp message data.

## Features
- Customer database with segmentation
- Automated response system
- Marketing automation
- Interactive dashboards
- Business analytics
- Location-based targeting (Arusha focus)

## Quick Start

### 1. Launch Dashboard
```bash
./launch_dashboard.sh
```
Then open: http://localhost:8501

### 2. Test Automation
```bash
./test_automation.sh
```

### 3. Extract Customer Data
```bash
python3 scripts/extract_customers.py
```

## Database Structure
- customers: Customer information and segmentation
- messages: All WhatsApp messages
- products: Product catalog
- sales: Sales transactions
- campaigns: Marketing campaigns
- automated_responses: Auto-response templates

## Key Components

### Customer Segmentation
- VIP: 1000+ messages
- Regular: 100-999 messages  
- Prospect: 10-99 messages
- Inactive: <10 messages

### Automated Responses
- Price inquiries
- Stock availability
- Delivery information
- Payment methods
- Greetings

### Marketing Automation
- Location-based campaigns
- Product-specific targeting
- Seasonal promotions
- Customer re-engagement

## Arusha Customers
Special focus on Arusha market with dedicated segmentation and campaigns.

## Reports
- Customer segments analysis
- Location-based analytics
- Message volume trends
- Top customers by activity

## Support
For issues or questions, check the logs in the logs/ directory.
'''
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/README.md', 'w') as f:
        f.write(readme_content)
    
    print("✅ Documentation created!")

def main():
    """Main setup function"""
    print("🏗️ Setting up WhatsApp CRM System...")
    print("=" * 50)
    
    try:
        create_directories()
        setup_database()
        install_dependencies()
        create_sample_data()
        create_launch_scripts()
        create_documentation()
        
        print("\n" + "=" * 50)
        print("🎉 CRM System Setup Complete!")
        print("\nNext Steps:")
        print("1. Run: ./launch_dashboard.sh")
        print("2. Open: http://localhost:8501")
        print("3. Extract your data: python3 scripts/extract_customers.py")
        print("\n📚 See README.md for full documentation")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
