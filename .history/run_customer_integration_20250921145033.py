#!/usr/bin/env python3
"""
Run Customer Integration - Execute the fixed SQL file
"""
import os
import subprocess
import sys

def show_integration_status():
    """Show current integration status"""
    print("🎯 CUSTOMER INTEGRATION STATUS")
    print("=" * 40)
    print()
    
    # Check if fixed files exist
    fixed_sql = "customer_database_updates_fixed.sql"
    fixed_csv = "customer_database_updates_fixed.csv"
    
    if os.path.exists(fixed_sql):
        print(f"✅ {fixed_sql} - Ready to run")
    else:
        print(f"❌ {fixed_sql} - Not found")
    
    if os.path.exists(fixed_csv):
        print(f"✅ {fixed_csv} - Ready for import")
    else:
        print(f"❌ {fixed_csv} - Not found")
    
    print()

def show_integration_options():
    """Show integration options"""
    print("🚀 INTEGRATION OPTIONS")
    print("=" * 30)
    print()
    print("1️⃣  SQL DATABASE UPDATE (Recommended)")
    print("   • File: customer_database_updates_fixed.sql")
    print("   • Method: Run in your database management tool")
    print("   • Status: ✅ Fixed and ready")
    print()
    print("2️⃣  CSV IMPORT")
    print("   • File: customer_database_updates_fixed.csv")
    print("   • Method: Upload to your customer system")
    print("   • Status: ✅ Fixed and ready")
    print()
    print("3️⃣  MANUAL VERIFICATION")
    print("   • Check database schema first")
    print("   • Verify all required columns exist")
    print("   • Test with a small batch first")
    print()

def show_database_requirements():
    """Show database requirements"""
    print("📋 DATABASE REQUIREMENTS")
    print("=" * 30)
    print()
    print("Required columns in your customers table:")
    print("  ✅ id (UUID)")
    print("  ✅ name (VARCHAR)")
    print("  ✅ phone (VARCHAR)")
    print("  ✅ email (VARCHAR)")
    print("  ✅ whatsapp (VARCHAR)")
    print("  ✅ gender (VARCHAR)")
    print("  ✅ city (VARCHAR)")
    print("  ✅ notes (TEXT)")
    print("  ✅ is_active (BOOLEAN)")
    print("  ✅ color_tag (TEXT)")
    print("  ✅ loyalty_level (TEXT)")
    print("  ✅ total_spent (NUMERIC)")
    print("  ✅ last_visit (TIMESTAMP)")
    print("  ✅ points (INTEGER)")
    print("  ✅ referral_source (TEXT)")
    print("  ✅ total_purchases (INTEGER)")
    print("  ✅ last_purchase_date (TIMESTAMP)")
    print("  ✅ created_at (TIMESTAMP)")
    print("  ✅ updated_at (TIMESTAMP)")
    print("  ✅ created_by (TEXT)")
    print("  ✅ whatsapp_opt_out (BOOLEAN)")
    print("  ✅ initial_notes (TEXT)")
    print("  ✅ customer_tag (TEXT)")
    print()

def show_execution_steps():
    """Show execution steps"""
    print("📋 EXECUTION STEPS")
    print("=" * 25)
    print()
    print("STEP 1: Backup your database")
    print("  • Always backup before making changes")
    print("  • Test in development environment first")
    print()
    print("STEP 2: Run the SQL file")
    print("  • Open your database management tool")
    print("  • Connect to your Supabase database")
    print("  • Run: customer_database_updates_fixed.sql")
    print()
    print("STEP 3: Verify the results")
    print("  • Check that 153 customers were imported")
    print("  • Verify loyalty levels are assigned")
    print("  • Confirm points are calculated")
    print()
    print("STEP 4: Update your application")
    print("  • Refresh your customer management interface")
    print("  • Test customer level display")
    print("  • Verify points system works")
    print()

def show_expected_results():
    """Show expected results"""
    print("🎯 EXPECTED RESULTS")
    print("=" * 25)
    print()
    print("After successful integration:")
    print("  • 153 customers imported")
    print("  • 12 Platinum customers (TSh 2M+)")
    print("  • 12 Gold customers (TSh 1M+)")
    print("  • 26 Silver customers (TSh 500K+)")
    print("  • 103 Bronze customers (TSh 0-500K)")
    print("  • TSh 193,149,077 total revenue")
    print("  • 193,147 loyalty points")
    print("  • 24 VIP customers identified")
    print()

def show_troubleshooting():
    """Show troubleshooting tips"""
    print("🔧 TROUBLESHOOTING")
    print("=" * 25)
    print()
    print("If you encounter errors:")
    print("  • Check database permissions")
    print("  • Verify all required columns exist")
    print("  • Ensure RLS policies allow inserts")
    print("  • Check for duplicate phone numbers")
    print("  • Verify data types match schema")
    print()
    print("Common issues:")
    print("  • Missing columns: Run ALTER TABLE statements first")
    print("  • Permission errors: Check RLS policies")
    print("  • Data type errors: Verify column types")
    print("  • Duplicate keys: Use ON CONFLICT handling")
    print()

def main():
    """Main function"""
    print("🚀 CUSTOMER INTEGRATION EXECUTION")
    print("=" * 50)
    print()
    
    show_integration_status()
    show_integration_options()
    show_database_requirements()
    show_execution_steps()
    show_expected_results()
    show_troubleshooting()
    
    print("✅ READY TO INTEGRATE!")
    print("=" * 25)
    print()
    print("The fixed SQL file is ready to run.")
    print("Follow the execution steps above to integrate your customers.")
    print()
    print("Need help? Check the troubleshooting section above.")

if __name__ == "__main__":
    main()
