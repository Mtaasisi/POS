#!/usr/bin/env python3
"""
Business Analytics Dashboard for Customer Transaction Data
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter

def load_customer_data():
    """Load comprehensive customer data"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Customer data file not found. Please run extract_all_transactions.py first.")
        return None

def analyze_revenue_trends(customers):
    """Analyze revenue trends over time"""
    print("=== REVENUE TRENDS ANALYSIS ===\n")
    
    # Group transactions by month
    monthly_revenue = defaultdict(int)
    monthly_transactions = defaultdict(int)
    
    for customer_data in customers.values():
        for transaction in customer_data['transactions']:
            if transaction['type'] == 'received':
                try:
                    # Parse date (format: "Sep 4, 2022 11:05:49 AM")
                    date_str = transaction['date']
                    date_obj = datetime.strptime(date_str, "%b %d, %Y %I:%M:%S %p")
                    month_key = date_obj.strftime("%Y-%m")
                    
                    monthly_revenue[month_key] += transaction['amount']
                    monthly_transactions[month_key] += 1
                except:
                    continue
    
    print("Monthly Revenue Breakdown:")
    print("-" * 50)
    for month in sorted(monthly_revenue.keys()):
        revenue = monthly_revenue[month]
        transactions = monthly_transactions[month]
        avg_transaction = revenue / transactions if transactions > 0 else 0
        print(f"{month}: TSh {revenue:>12,} ({transactions:>3} transactions, avg: TSh {avg_transaction:>8,.0f})")
    
    total_revenue = sum(monthly_revenue.values())
    print(f"\nTotal Revenue: TSh {total_revenue:,}")
    
    return monthly_revenue, monthly_transactions

def customer_segmentation_analysis(customers):
    """Analyze customer segments"""
    print("\n=== CUSTOMER SEGMENTATION ANALYSIS ===\n")
    
    # Filter customers with payments
    paying_customers = [(phone, data) for phone, data in customers.items() if data['total_received'] > 0]
    
    # Define segments
    segments = {
        'VIP (TSh 2M+)': [],
        'High Value (TSh 1M-2M)': [],
        'Medium Value (TSh 500K-1M)': [],
        'Low Value (<TSh 500K)': []
    }
    
    for phone, data in paying_customers:
        amount = data['total_received']
        if amount >= 2000000:
            segments['VIP (TSh 2M+)'].append((phone, data))
        elif amount >= 1000000:
            segments['High Value (TSh 1M-2M)'].append((phone, data))
        elif amount >= 500000:
            segments['Medium Value (TSh 500K-1M)'].append((phone, data))
        else:
            segments['Low Value (<TSh 500K)'].append((phone, data))
    
    print("Customer Segments:")
    print("-" * 60)
    total_customers = len(paying_customers)
    total_revenue = sum(data['total_received'] for _, data in paying_customers)
    
    for segment_name, segment_customers in segments.items():
        count = len(segment_customers)
        segment_revenue = sum(data['total_received'] for _, data in segment_customers)
        percentage = (count / total_customers) * 100 if total_customers > 0 else 0
        revenue_percentage = (segment_revenue / total_revenue) * 100 if total_revenue > 0 else 0
        
        print(f"{segment_name:<25}: {count:>3} customers ({percentage:>5.1f}%) - TSh {segment_revenue:>12,} ({revenue_percentage:>5.1f}%)")
    
    return segments

def identify_business_opportunities(customers):
    """Identify business opportunities and recommendations"""
    print("\n=== BUSINESS OPPORTUNITIES & RECOMMENDATIONS ===\n")
    
    paying_customers = [(phone, data) for phone, data in customers.items() if data['total_received'] > 0]
    
    # 1. Top customers for VIP treatment
    top_customers = sorted(paying_customers, key=lambda x: x[1]['total_received'], reverse=True)[:10]
    print("🎯 VIP CUSTOMERS (Top 10):")
    print("   These customers deserve special attention and exclusive offers")
    for i, (phone, data) in enumerate(top_customers, 1):
        print(f"   {i:2d}. {data['name']} - TSh {data['total_received']:,}")
    
    # 2. Growth opportunities (medium value customers)
    medium_customers = [(phone, data) for phone, data in paying_customers 
                       if 500000 <= data['total_received'] < 1000000]
    print(f"\n📈 GROWTH OPPORTUNITIES:")
    print(f"   {len(medium_customers)} medium-value customers (TSh 500K-1M)")
    print("   Target these customers for upselling and increased engagement")
    
    # 3. Service diversification
    service_usage = defaultdict(int)
    for data in customers.values():
        for service in data['services_used']:
            service_usage[service] += 1
    
    print(f"\n💳 MOBILE MONEY SERVICES:")
    for service, count in sorted(service_usage.items(), key=lambda x: x[1], reverse=True):
        print(f"   {service}: {count} customers")
    
    # 4. Transaction frequency analysis
    high_frequency = [(phone, data) for phone, data in paying_customers 
                     if data['transaction_count'] >= 10]
    print(f"\n🔄 HIGH-FREQUENCY CUSTOMERS:")
    print(f"   {len(high_frequency)} customers with 10+ transactions")
    print("   These are your most loyal customers - focus on retention")
    
    return {
        'top_customers': top_customers,
        'medium_customers': medium_customers,
        'high_frequency': high_frequency,
        'service_usage': service_usage
    }

def generate_marketing_recommendations(customers):
    """Generate specific marketing recommendations"""
    print("\n=== MARKETING RECOMMENDATIONS ===\n")
    
    paying_customers = [(phone, data) for phone, data in customers.items() if data['total_received'] > 0]
    
    # 1. Loyalty program recommendations
    print("🏆 LOYALTY PROGRAM STRUCTURE:")
    print("   Bronze (TSh 100K-500K): 5% discount on next purchase")
    print("   Silver (TSh 500K-1M): 10% discount + priority service")
    print("   Gold (TSh 1M-2M): 15% discount + exclusive offers")
    print("   Platinum (TSh 2M+): 20% discount + personal account manager")
    
    # 2. Re-engagement campaigns
    print(f"\n📱 RE-ENGAGEMENT CAMPAIGNS:")
    print("   Send personalized SMS/WhatsApp messages to:")
    print("   - Customers who haven't transacted in 30+ days")
    print("   - Medium-value customers with growth potential")
    print("   - High-frequency customers for retention")
    
    # 3. Cross-selling opportunities
    print(f"\n🛒 CROSS-SELLING OPPORTUNITIES:")
    print("   - Offer additional services to high-value customers")
    print("   - Bundle products for medium-value customers")
    print("   - Introduce new services to loyal customers first")
    
    # 4. Seasonal promotions
    print(f"\n🎉 SEASONAL PROMOTIONS:")
    print("   - End-of-month promotions for regular customers")
    print("   - Holiday specials for VIP customers")
    print("   - Referral bonuses for high-frequency customers")

def create_customer_export_for_marketing(customers):
    """Create marketing-ready customer lists"""
    paying_customers = [(phone, data) for phone, data in customers.items() if data['total_received'] > 0]
    
    # VIP customers list
    vip_customers = [(phone, data) for phone, data in paying_customers if data['total_received'] >= 1000000]
    
    # Medium value customers
    medium_customers = [(phone, data) for phone, data in paying_customers 
                       if 500000 <= data['total_received'] < 1000000]
    
    # High frequency customers
    high_freq_customers = [(phone, data) for phone, data in paying_customers 
                          if data['transaction_count'] >= 5]
    
    # Export to CSV files
    import csv
    
    # VIP customers
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/vip_customers.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Name', 'Phone', 'Total_Spent', 'Transactions', 'Services'])
        for phone, data in vip_customers:
            writer.writerow([data['name'], phone, data['total_received'], 
                           data['transaction_count'], ', '.join(data['services_used'])])
    
    # Medium value customers
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/medium_value_customers.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Name', 'Phone', 'Total_Spent', 'Transactions', 'Services'])
        for phone, data in medium_customers:
            writer.writerow([data['name'], phone, data['total_received'], 
                           data['transaction_count'], ', '.join(data['services_used'])])
    
    print(f"\n📊 MARKETING LISTS EXPORTED:")
    print(f"   VIP customers: {len(vip_customers)} customers")
    print(f"   Medium value customers: {len(medium_customers)} customers")
    print(f"   High frequency customers: {len(high_freq_customers)} customers")

def main():
    """Main dashboard function"""
    customers = load_customer_data()
    if not customers:
        return
    
    print("🚀 BUSINESS ANALYTICS DASHBOARD")
    print("=" * 60)
    
    # Run all analyses
    monthly_revenue, monthly_transactions = analyze_revenue_trends(customers)
    segments = customer_segmentation_analysis(customers)
    opportunities = identify_business_opportunities(customers)
    generate_marketing_recommendations(customers)
    create_customer_export_for_marketing(customers)
    
    print(f"\n✅ Dashboard analysis complete!")
    print(f"📁 Check the generated CSV files for marketing campaigns")

if __name__ == "__main__":
    main()
