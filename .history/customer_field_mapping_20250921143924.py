#!/usr/bin/env python3
"""
Customer Field Mapping - Shows exactly what fields will be updated
Based on your customer database schema and transaction data
"""
import json
from datetime import datetime

def load_transaction_data():
    """Load comprehensive transaction data"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Transaction data file not found.")
        return None

def show_field_mapping():
    """Show detailed field mapping for customer updates"""
    print("=== CUSTOMER FIELD MAPPING ===\n")
    
    print("📋 DATABASE FIELDS THAT WILL BE UPDATED:")
    print("-" * 60)
    
    field_mappings = [
        ("name", "Customer name from SMS data or 'Customer XXXX' if unknown"),
        ("phone", "Phone number from SMS transactions"),
        ("whatsapp", "Same as phone number"),
        ("gender", "Default to 'other' (not available in SMS)"),
        ("city", "Default to 'Dar es Salaam'"),
        ("country", "Default to 'Tanzania'"),
        ("color_tag", "Calculated: 'vip' (TSh 1M+), 'purchased' (TSh 100K+), 'new' (others)"),
        ("loyalty_level", "Calculated: 'platinum' (TSh 2M+), 'gold' (TSh 1M+), 'silver' (TSh 500K+), 'bronze' (others)"),
        ("total_spent", "Total amount from all transactions"),
        ("points", "Calculated: 1 point per TSh 1,000 spent"),
        ("last_visit", "Date of most recent transaction"),
        ("total_purchases", "Number of transactions"),
        ("last_purchase_date", "Date of most recent transaction"),
        ("created_at", "Date of first transaction (member since)"),
        ("updated_at", "Current timestamp"),
        ("referral_source", "Set to 'SMS Import'"),
        ("customer_tag", "Same as color_tag"),
        ("is_active", "Set to true"),
        ("notes", "Auto-generated with transaction summary"),
        ("initial_notes", "Auto-generated with import details"),
        ("created_by", "Set to 'system_import'"),
        ("whatsapp_opt_out", "Set to false")
    ]
    
    for field, description in field_mappings:
        print(f"  {field:<20} → {description}")
    
    print(f"\n📊 CALCULATION LOGIC:")
    print("-" * 40)
    print("  Loyalty Levels:")
    print("    • Platinum: TSh 2,000,000+ (12 customers)")
    print("    • Gold: TSh 1,000,000 - 1,999,999 (12 customers)")
    print("    • Silver: TSh 500,000 - 999,999 (26 customers)")
    print("    • Bronze: TSh 0 - 499,999 (103 customers)")
    
    print(f"\n  Color Tags:")
    print("    • VIP: TSh 1,000,000+ or high transaction count")
    print("    • Purchased: TSh 100,000+ or 10+ transactions")
    print("    • New: All others")
    
    print(f"\n  Points System:")
    print("    • 1 point = TSh 1,000 spent")
    print("    • Total points: 193,147 points across all customers")

def show_sample_customer_update():
    """Show sample customer update data"""
    print(f"\n=== SAMPLE CUSTOMER UPDATE ===")
    print("-" * 50)
    
    sample_customer = {
        "id": "uuid-generated",
        "name": "SIMU KITAA",
        "phone": "25571184504",
        "email": None,
        "whatsapp": "25571184504",
        "gender": "other",
        "city": "Dar es Salaam",
        "country": "Tanzania",
        "color_tag": "vip",
        "loyalty_level": "platinum",
        "total_spent": 4930000,
        "points": 4930,
        "last_visit": "2023-08-15T14:30:00Z",
        "total_purchases": 2,
        "last_purchase_date": "2023-08-15T14:30:00Z",
        "created_at": "2022-09-05T11:46:16Z",
        "updated_at": "2024-01-19T10:00:00Z",
        "referral_source": "SMS Import",
        "customer_tag": "vip",
        "is_active": True,
        "notes": "Auto-imported from SMS transactions. Total transactions: 2",
        "initial_notes": "Customer imported from SMS transaction data. First transaction: 2022-09-05T11:46:16Z",
        "created_by": "system_import",
        "whatsapp_opt_out": False
    }
    
    print("Sample customer data that will be inserted/updated:")
    for key, value in sample_customer.items():
        print(f"  {key}: {value}")

def show_integration_benefits():
    """Show benefits of customer integration"""
    print(f"\n=== INTEGRATION BENEFITS ===")
    print("-" * 40)
    
    benefits = [
        "✅ Complete customer profiles with transaction history",
        "✅ Automatic loyalty level assignment based on spending",
        "✅ Accurate member since dates from first transaction",
        "✅ Real last visit dates from transaction data",
        "✅ Proper points calculation for loyalty program",
        "✅ Customer segmentation for targeted marketing",
        "✅ VIP customer identification for special treatment",
        "✅ Total spending tracking for business analytics",
        "✅ Transaction count for customer engagement analysis",
        "✅ Ready for loyalty program implementation"
    ]
    
    for benefit in benefits:
        print(f"  {benefit}")

def show_next_steps():
    """Show next steps for integration"""
    print(f"\n=== NEXT STEPS ===")
    print("-" * 30)
    
    steps = [
        "1. Review the generated CSV files:",
        "   • customer_database_updates.csv (153 customers)",
        "   • customer_import_summary.csv (loyalty level breakdown)",
        "",
        "2. Choose integration method:",
        "   • Option A: Use SQL file (customer_database_updates.sql)",
        "   • Option B: Use manual import script (manual_customer_import.py)",
        "   • Option C: Use Supabase integration script",
        "",
        "3. Update your customer management system:",
        "   • Customer levels will be automatically assigned",
        "   • Points will be calculated and assigned",
        "   • Member since dates will be set from first transaction",
        "   • Last visit dates will be updated from latest transaction",
        "",
        "4. Verify integration:",
        "   • Check customer levels in your system",
        "   • Verify points calculations",
        "   • Confirm date fields are correct",
        "",
        "5. Start using enhanced customer data:",
        "   • Implement loyalty program",
        "   • Create targeted marketing campaigns",
        "   • Provide VIP customer service"
    ]
    
    for step in steps:
        print(f"  {step}")

def main():
    """Main function"""
    print("🎯 CUSTOMER FIELD MAPPING & INTEGRATION GUIDE")
    print("=" * 60)
    
    show_field_mapping()
    show_sample_customer_update()
    show_integration_benefits()
    show_next_steps()
    
    print(f"\n✅ Integration guide complete!")
    print(f"📁 All necessary files have been generated for customer integration.")

if __name__ == "__main__":
    main()
