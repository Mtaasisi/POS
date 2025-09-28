#!/usr/bin/env python3
"""
Customer Lifetime Value (CLV) Prediction and Analysis
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict

def load_customer_data():
    """Load comprehensive customer data"""
    try:
        with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/comprehensive_customer_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Customer data file not found. Please run extract_all_transactions.py first.")
        return None

def calculate_customer_lifetime_value(customers):
    """Calculate Customer Lifetime Value for each customer"""
    print("=== CUSTOMER LIFETIME VALUE ANALYSIS ===\n")
    
    clv_data = []
    
    for phone, data in customers.items():
        if data['total_received'] > 0:
            # Calculate metrics
            total_spent = data['total_received']
            transaction_count = data['transaction_count']
            
            # Calculate average transaction value
            avg_transaction = total_spent / transaction_count if transaction_count > 0 else 0
            
            # Calculate customer age (days since first transaction)
            if data['transactions']:
                first_transaction = min(data['transactions'], key=lambda x: x['date'])
                last_transaction = max(data['transactions'], key=lambda x: x['date'])
                
                try:
                    first_date = datetime.strptime(first_transaction['date'], "%b %d, %Y %I:%M:%S %p")
                    last_date = datetime.strptime(last_transaction['date'], "%b %d, %Y %I:%M:%S %p")
                    customer_age_days = (last_date - first_date).days + 1
                except:
                    customer_age_days = 365  # Default to 1 year if date parsing fails
            else:
                customer_age_days = 365
            
            # Calculate purchase frequency (transactions per year)
            purchase_frequency = (transaction_count / customer_age_days) * 365 if customer_age_days > 0 else 0
            
            # Predict future value (next 12 months)
            predicted_annual_value = avg_transaction * purchase_frequency
            predicted_3_year_value = predicted_annual_value * 3
            
            # Customer value tier
            if total_spent >= 2000000:
                tier = "Platinum"
            elif total_spent >= 1000000:
                tier = "Gold"
            elif total_spent >= 500000:
                tier = "Silver"
            else:
                tier = "Bronze"
            
            clv_data.append({
                'phone': phone,
                'name': data['name'],
                'total_spent': total_spent,
                'transaction_count': transaction_count,
                'avg_transaction': avg_transaction,
                'customer_age_days': customer_age_days,
                'purchase_frequency': purchase_frequency,
                'predicted_annual_value': predicted_annual_value,
                'predicted_3_year_value': predicted_3_year_value,
                'tier': tier
            })
    
    # Sort by predicted 3-year value
    clv_data.sort(key=lambda x: x['predicted_3_year_value'], reverse=True)
    
    return clv_data

def display_clv_analysis(clv_data):
    """Display CLV analysis results"""
    print("TOP 20 CUSTOMERS BY PREDICTED LIFETIME VALUE:")
    print("-" * 100)
    print(f"{'Rank':<4} {'Name':<20} {'Tier':<8} {'Total Spent':<12} {'Predicted 3Y':<12} {'Frequency':<10} {'Avg Trans':<10}")
    print("-" * 100)
    
    for i, customer in enumerate(clv_data[:20], 1):
        name = customer['name'][:19] if customer['name'] else 'Unknown'
        print(f"{i:<4} {name:<20} {customer['tier']:<8} {customer['total_spent']:>10,} {customer['predicted_3_year_value']:>10,.0f} {customer['purchase_frequency']:>8.1f} {customer['avg_transaction']:>8,.0f}")
    
    # Tier analysis
    tier_stats = defaultdict(lambda: {'count': 0, 'total_value': 0, 'total_predicted': 0})
    
    for customer in clv_data:
        tier = customer['tier']
        tier_stats[tier]['count'] += 1
        tier_stats[tier]['total_value'] += customer['total_spent']
        tier_stats[tier]['total_predicted'] += customer['predicted_3_year_value']
    
    print(f"\n=== CUSTOMER TIER ANALYSIS ===")
    print("-" * 70)
    print(f"{'Tier':<8} {'Count':<6} {'Total Spent':<15} {'Predicted 3Y':<15} {'Avg CLV':<12}")
    print("-" * 70)
    
    for tier in ['Platinum', 'Gold', 'Silver', 'Bronze']:
        if tier in tier_stats:
            stats = tier_stats[tier]
            avg_clv = stats['total_predicted'] / stats['count'] if stats['count'] > 0 else 0
            print(f"{tier:<8} {stats['count']:<6} {stats['total_value']:>12,} {stats['total_predicted']:>12,.0f} {avg_clv:>10,.0f}")
    
    # Business insights
    total_predicted_value = sum(customer['predicted_3_year_value'] for customer in clv_data)
    total_current_value = sum(customer['total_spent'] for customer in clv_data)
    
    print(f"\n=== BUSINESS INSIGHTS ===")
    print(f"Total Current Customer Value: TSh {total_current_value:,}")
    print(f"Total Predicted 3-Year Value: TSh {total_predicted_value:,.0f}")
    print(f"Growth Potential: TSh {total_predicted_value - total_current_value:,.0f}")
    print(f"Average Customer Lifetime Value: TSh {total_predicted_value / len(clv_data):,.0f}")

def identify_retention_opportunities(clv_data):
    """Identify customers at risk of churning"""
    print(f"\n=== CUSTOMER RETENTION OPPORTUNITIES ===")
    
    # High value, low frequency customers (at risk)
    at_risk_customers = [
        customer for customer in clv_data 
        if customer['total_spent'] >= 500000 and customer['purchase_frequency'] < 2
    ]
    
    print(f"🚨 HIGH-VALUE CUSTOMERS AT RISK:")
    print(f"   {len(at_risk_customers)} customers with high value but low frequency")
    print("   These customers need immediate attention to prevent churn")
    
    for customer in at_risk_customers[:5]:
        name = customer['name'] if customer['name'] else 'Unknown'
        print(f"   - {name}: TSh {customer['total_spent']:,} (Frequency: {customer['purchase_frequency']:.1f}/year)")
    
    # High frequency, medium value customers (growth potential)
    growth_customers = [
        customer for customer in clv_data 
        if customer['purchase_frequency'] >= 4 and 100000 <= customer['total_spent'] < 500000
    ]
    
    print(f"\n📈 GROWTH POTENTIAL CUSTOMERS:")
    print(f"   {len(growth_customers)} customers with high frequency but medium value")
    print("   These customers are loyal and can be upsold")
    
    for customer in growth_customers[:5]:
        name = customer['name'] if customer['name'] else 'Unknown'
        print(f"   - {name}: TSh {customer['total_spent']:,} (Frequency: {customer['purchase_frequency']:.1f}/year)")

def export_clv_data(clv_data):
    """Export CLV data to CSV"""
    import csv
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/customer_lifetime_values.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['Name', 'Phone', 'Tier', 'Total_Spent', 'Transaction_Count', 'Avg_Transaction', 
                     'Customer_Age_Days', 'Purchase_Frequency', 'Predicted_Annual_Value', 'Predicted_3_Year_Value']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for customer in clv_data:
            writer.writerow({
                'Name': customer['name'],
                'Phone': customer['phone'],
                'Tier': customer['tier'],
                'Total_Spent': customer['total_spent'],
                'Transaction_Count': customer['transaction_count'],
                'Avg_Transaction': round(customer['avg_transaction'], 0),
                'Customer_Age_Days': customer['customer_age_days'],
                'Purchase_Frequency': round(customer['purchase_frequency'], 2),
                'Predicted_Annual_Value': round(customer['predicted_annual_value'], 0),
                'Predicted_3_Year_Value': round(customer['predicted_3_year_value'], 0)
            })
    
    print(f"\n📊 CLV data exported to: customer_lifetime_values.csv")

def main():
    """Main CLV analysis function"""
    customers = load_customer_data()
    if not customers:
        return
    
    print("💰 CUSTOMER LIFETIME VALUE ANALYSIS")
    print("=" * 60)
    
    clv_data = calculate_customer_lifetime_value(customers)
    display_clv_analysis(clv_data)
    identify_retention_opportunities(clv_data)
    export_clv_data(clv_data)
    
    print(f"\n✅ CLV analysis complete!")

if __name__ == "__main__":
    main()
