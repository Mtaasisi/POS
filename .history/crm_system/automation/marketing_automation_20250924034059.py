#!/usr/bin/env python3
"""
WhatsApp CRM Marketing Automation
Handles automated marketing campaigns, customer segmentation, and targeted messaging
"""

import sqlite3
import pandas as pd
from datetime import datetime, timedelta
import json
from typing import List, Dict, Optional

class MarketingAutomation:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        
        # Marketing templates
        self.marketing_templates = {
            'new_product_announcement': {
                'subject': 'Bidhaa Mpya! 🎉',
                'template': 'Habari {name}! Tuna bidhaa mpya ya {product} kwa bei ya {price}. Je, ungependa kuona picha?',
                'target_segments': ['vip', 'regular']
            },
            'price_drop_alert': {
                'subject': 'Bei Imeshuka! ⬇️',
                'template': 'Habari {name}! Bei ya {product} imeshuka kutoka {old_price} hadi {new_price}. Fursa hii ni ya muda mfupi!',
                'target_segments': ['vip', 'regular', 'prospect']
            },
            'stock_reminder': {
                'subject': 'Stock Inakaribia Kuisha! ⚠️',
                'template': 'Habari {name}! {product} inakaribia kuisha stock. Agiza sasa kabla haijaisha!',
                'target_segments': ['vip', 'regular']
            },
            'follow_up': {
                'subject': 'Je, Umeamua? 🤔',
                'template': 'Habari {name}! Ulikuwa unafikiria kununua {product}. Je, bado unahitaji? Tuna offer maalum kwa wewe!',
                'target_segments': ['prospect']
            },
            'loyalty_reward': {
                'subject': 'Asante kwa Uaminifu! 🎁',
                'template': 'Habari {name}! Kama mteja wa thamani, unapata discount ya {discount}% kwa {product}. Code: {code}',
                'target_segments': ['vip']
            },
            'seasonal_promotion': {
                'subject': 'Promotion ya Msimu! 🌟',
                'template': 'Habari {name}! Tuna promotion maalum ya {season}. {product} kwa bei ya {price}. Muda: {duration}',
                'target_segments': ['vip', 'regular', 'prospect']
            }
        }
    
    def get_customer_segments(self) -> Dict[str, List]:
        """Get customers organized by segments"""
        cursor = self.conn.cursor()
        
        segments = {}
        cursor.execute("SELECT DISTINCT segment FROM customers")
        segment_names = [row[0] for row in cursor.fetchall()]
        
        for segment in segment_names:
            cursor.execute("""
                SELECT phone_number, name, preferred_products, total_messages, last_contact_date
                FROM customers 
                WHERE segment = ? AND phone_number IS NOT NULL
            """, (segment,))
            segments[segment] = cursor.fetchall()
        
        return segments
    
    def get_location_based_customers(self, location: str) -> List:
        """Get customers from specific location"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT phone_number, name, preferred_products, total_messages, last_contact_date
            FROM customers 
            WHERE location = ? AND phone_number IS NOT NULL
        """, (location,))
        
        return cursor.fetchall()
    
    def get_inactive_customers(self, days_threshold: int = 30) -> List:
        """Get customers who haven't contacted in specified days"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT phone_number, name, preferred_products, total_messages, last_contact_date
            FROM customers 
            WHERE last_contact_date < date('now', '-{} days') 
            AND phone_number IS NOT NULL
            ORDER BY last_contact_date DESC
        """.format(days_threshold))
        
        return cursor.fetchall()
    
    def get_high_value_customers(self, min_messages: int = 100) -> List:
        """Get high-value customers based on message volume"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT phone_number, name, preferred_products, total_messages, last_contact_date
            FROM customers 
            WHERE total_messages >= ? AND phone_number IS NOT NULL
            ORDER BY total_messages DESC
        """, (min_messages,))
        
        return cursor.fetchall()
    
    def get_product_interested_customers(self, product_category: str) -> List:
        """Get customers interested in specific product category"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT phone_number, name, preferred_products, total_messages, last_contact_date
            FROM customers 
            WHERE preferred_products LIKE ? AND phone_number IS NOT NULL
        """, (f'%{product_category}%',))
        
        return cursor.fetchall()
    
    def create_campaign(self, campaign_name: str, template_name: str, target_criteria: Dict) -> Dict:
        """Create a marketing campaign"""
        template = self.marketing_templates.get(template_name)
        if not template:
            return {'error': 'Template not found'}
        
        # Get target customers based on criteria
        target_customers = self._get_target_customers(target_criteria)
        
        campaign = {
            'name': campaign_name,
            'template': template,
            'target_customers': target_customers,
            'created_at': datetime.now(),
            'status': 'draft'
        }
        
        return campaign
    
    def _get_target_customers(self, criteria: Dict) -> List:
        """Get customers based on targeting criteria"""
        if 'segment' in criteria:
            return self.get_customer_segments().get(criteria['segment'], [])
        elif 'location' in criteria:
            return self.get_location_based_customers(criteria['location'])
        elif 'inactive_days' in criteria:
            return self.get_inactive_customers(criteria['inactive_days'])
        elif 'min_messages' in criteria:
            return self.get_high_value_customers(criteria['min_messages'])
        elif 'product_category' in criteria:
            return self.get_product_interested_customers(criteria['product_category'])
        else:
            return []
    
    def personalize_message(self, template: str, customer_data: tuple, product_info: Dict = None) -> str:
        """Personalize message template with customer data"""
        phone, name, preferred_products, total_messages, last_contact = customer_data
        
        # Replace placeholders
        message = template['template']
        message = message.replace('{name}', name or 'Mteja')
        message = message.replace('{phone}', phone)
        
        # Add product information if provided
        if product_info:
            for key, value in product_info.items():
                message = message.replace(f'{{{key}}}', str(value))
        
        return message
    
    def schedule_campaign(self, campaign: Dict, send_time: datetime = None) -> Dict:
        """Schedule a campaign for sending"""
        if not send_time:
            send_time = datetime.now() + timedelta(hours=1)  # Default: 1 hour from now
        
        campaign['scheduled_time'] = send_time
        campaign['status'] = 'scheduled'
        
        # Save campaign to database (would need campaigns table)
        self._save_campaign(campaign)
        
        return campaign
    
    def _save_campaign(self, campaign: Dict):
        """Save campaign to database"""
        cursor = self.conn.cursor()
        
        # Create campaigns table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255),
                template_name VARCHAR(100),
                target_criteria TEXT,
                scheduled_time DATETIME,
                status VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            INSERT INTO campaigns (name, template_name, target_criteria, scheduled_time, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            campaign['name'],
            campaign['template']['subject'],
            json.dumps(campaign.get('target_criteria', {})),
            campaign['scheduled_time'],
            campaign['status']
        ))
        
        self.conn.commit()
    
    def get_campaign_performance(self) -> Dict:
        """Get performance metrics for campaigns"""
        cursor = self.conn.cursor()
        
        # Create campaign_messages table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS campaign_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER,
                customer_phone VARCHAR(20),
                message_sent DATETIME,
                status VARCHAR(50),
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
            )
        """)
        
        # Get campaign statistics
        cursor.execute("""
            SELECT COUNT(*) FROM campaigns
        """)
        total_campaigns = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM campaign_messages
        """)
        total_messages_sent = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM campaign_messages 
            WHERE message_sent >= date('now', '-7 days')
        """)
        recent_messages = cursor.fetchone()[0]
        
        return {
            'total_campaigns': total_campaigns,
            'total_messages_sent': total_messages_sent,
            'recent_messages_7d': recent_messages
        }
    
    def create_arusha_campaign(self, campaign_type: str = 'new_product_announcement') -> Dict:
        """Create a specific campaign for Arusha customers"""
        arusha_customers = self.get_location_based_customers('Arusha')
        
        if not arusha_customers:
            return {'error': 'No Arusha customers found'}
        
        campaign = self.create_campaign(
            f'Arusha {campaign_type.title()}',
            campaign_type,
            {'location': 'Arusha'}
        )
        
        return campaign
    
    def create_seasonal_campaign(self, season: str, product: str, price: str, duration: str) -> Dict:
        """Create a seasonal promotion campaign"""
        template = self.marketing_templates['seasonal_promotion']
        
        # Get all active customers
        segments = self.get_customer_segments()
        all_customers = []
        for segment_customers in segments.values():
            all_customers.extend(segment_customers)
        
        campaign = {
            'name': f'{season} Promotion',
            'template': template,
            'target_customers': all_customers,
            'product_info': {
                'season': season,
                'product': product,
                'price': price,
                'duration': duration
            },
            'created_at': datetime.now(),
            'status': 'draft'
        }
        
        return campaign
    
    def get_customer_engagement_score(self, customer_phone: str) -> float:
        """Calculate customer engagement score"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT total_messages, last_contact_date, segment
            FROM customers WHERE phone_number = ?
        """, (customer_phone,))
        
        result = cursor.fetchone()
        if not result:
            return 0.0
        
        total_messages, last_contact, segment = result
        
        # Calculate days since last contact
        if last_contact:
            last_contact_date = datetime.strptime(last_contact, '%Y-%m-%d %H:%M:%S')
            days_since_contact = (datetime.now() - last_contact_date).days
        else:
            days_since_contact = 365
        
        # Engagement score calculation
        message_score = min(total_messages / 100, 1.0)  # Max 1.0 for 100+ messages
        recency_score = max(0, 1 - (days_since_contact / 365))  # Decreases over time
        segment_score = {'vip': 1.0, 'regular': 0.7, 'prospect': 0.4, 'inactive': 0.1}.get(segment, 0.5)
        
        engagement_score = (message_score * 0.4 + recency_score * 0.3 + segment_score * 0.3)
        
        return round(engagement_score, 2)
    
    def close(self):
        """Close database connection"""
        self.conn.close()

# Example usage
def main():
    automation = MarketingAutomation('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db')
    
    # Create Arusha campaign
    arusha_campaign = automation.create_arusha_campaign('new_product_announcement')
    print(f"Arusha Campaign: {arusha_campaign}")
    
    # Create seasonal campaign
    seasonal_campaign = automation.create_seasonal_campaign(
        'Christmas', 'iPhone 15', 'Tsh 1,200,000', '7 days'
    )
    print(f"Seasonal Campaign: {seasonal_campaign}")
    
    # Get customer segments
    segments = automation.get_customer_segments()
    print(f"Customer Segments: {list(segments.keys())}")
    
    # Get campaign performance
    performance = automation.get_campaign_performance()
    print(f"Campaign Performance: {performance}")
    
    automation.close()

if __name__ == "__main__":
    main()
