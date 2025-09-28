#!/usr/bin/env python3
"""
WhatsApp CRM Automated Response System
Handles automated responses based on message content and customer history
"""

import re
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional

class WhatsAppAutoResponder:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        
        # Initialize response templates
        self.response_templates = {
            'greeting': [
                "Habari! Karibu kwenye duka letu. Tunaweza kukusaidia vipi leo?",
                "Hujambo! Tunafurahi kukuona tena. Unaweza kutuambia unahitaji nini?",
                "Shikamoo! Tuna bidhaa nyingi za kuvutia. Unaangalia nini leo?"
            ],
            'price_inquiry': [
                "Asante kwa kuuliza bei. {product} inauzwa kwa {price}. Je, ungependa maelezo zaidi?",
                "Bei ya {product} ni {price}. Tuna pia {related_products}. Unaweza kuona picha?",
                "{product} - {price}. Tuna stock ya kutosha. Ungependa kuagiza?"
            ],
            'availability': [
                "Ndiyo, {product} ipo stock. Tuna {quantity} pieces. Ungependa kuagiza?",
                "{product} inapatikana. Bei ni {price}. Tunaweza kukutumia leo.",
                "Stock ipo! {product} inauzwa kwa {price}. Je, ungependa kuona picha?"
            ],
            'delivery': [
                "Tunafanya delivery kote Tanzania. Gharama ni {delivery_cost}. Muda wa kufika ni {delivery_time}.",
                "Tunaweza kukutumia {product}. Gharama ya usafiri ni {delivery_cost}.",
                "Delivery inapatikana. Tunaweza kukutumia leo. Gharama ni {delivery_cost}."
            ],
            'payment': [
                "Tunakubali malipo ya M-Pesa, Tigo Pesa, na cash. Namba ya M-Pesa: {mpesa_number}",
                "Unaweza kulipa kwa M-Pesa: {mpesa_number} au Tigo Pesa: {tigo_number}",
                "Malipo: M-Pesa {mpesa_number}, Tigo Pesa {tigo_number}, au cash on delivery"
            ],
            'thank_you': [
                "Asante sana kwa kununua kutoka kwetu! Tunaamini utafurahi na bidhaa.",
                "Karibu tena! Tuna bidhaa mpya kila siku. Tutakuwa na habari.",
                "Asante! Tunaamini utarudi tena. Kama una maswali, tuwasiliane."
            ]
        }
        
        # Business information
        self.business_info = {
            'mpesa_number': '+255714440144',
            'tigo_number': '+255714440144',
            'delivery_cost': 'Tsh 5,000 - 15,000',
            'delivery_time': '1-3 siku'
        }
    
    def analyze_message(self, message_text: str, customer_phone: str) -> Dict:
        """Analyze incoming message and determine appropriate response"""
        message_lower = message_text.lower()
        
        # Check for greetings
        if any(greeting in message_lower for greeting in ['hujambo', 'habari', 'shikamoo', 'mambo', 'hello']):
            return {'type': 'greeting', 'confidence': 0.9}
        
        # Check for price inquiries
        if any(keyword in message_lower for keyword in ['bei', 'price', 'cost', 'pesa', 'ngapi']):
            return {'type': 'price_inquiry', 'confidence': 0.8}
        
        # Check for availability
        if any(keyword in message_lower for keyword in ['ipo', 'inapatikana', 'stock', 'available', 'ninaweza']):
            return {'type': 'availability', 'confidence': 0.8}
        
        # Check for delivery inquiries
        if any(keyword in message_lower for keyword in ['delivery', 'tuma', 'safiri', 'gharama', 'usafiri']):
            return {'type': 'delivery', 'confidence': 0.8}
        
        # Check for payment inquiries
        if any(keyword in message_lower for keyword in ['lipa', 'payment', 'mpesa', 'tigo', 'pesa']):
            return {'type': 'payment', 'confidence': 0.8}
        
        # Check for thank you messages
        if any(keyword in message_lower for keyword in ['asante', 'thank you', 'shukrani', 'nashukuru']):
            return {'type': 'thank_you', 'confidence': 0.9}
        
        return {'type': 'general', 'confidence': 0.3}
    
    def get_customer_history(self, customer_phone: str) -> Dict:
        """Get customer interaction history"""
        cursor = self.conn.cursor()
        
        # Get customer info
        cursor.execute("""
            SELECT name, segment, total_messages, last_contact_date, preferred_products
            FROM customers WHERE phone_number = ?
        """, (customer_phone,))
        
        customer = cursor.fetchone()
        if not customer:
            return {'is_new_customer': True}
        
        # Get recent messages
        cursor.execute("""
            SELECT message_text, message_date FROM messages 
            WHERE phone_number = ? 
            ORDER BY message_date DESC LIMIT 5
        """, (customer_phone,))
        
        recent_messages = cursor.fetchall()
        
        return {
            'is_new_customer': False,
            'name': customer[0],
            'segment': customer[1],
            'total_messages': customer[2],
            'last_contact_date': customer[3],
            'preferred_products': customer[4],
            'recent_messages': recent_messages
        }
    
    def generate_response(self, message_text: str, customer_phone: str) -> Optional[str]:
        """Generate automated response based on message analysis"""
        analysis = self.analyze_message(message_text, customer_phone)
        customer_history = self.get_customer_history(customer_phone)
        
        # Skip if confidence is too low
        if analysis['confidence'] < 0.5:
            return None
        
        response_type = analysis['type']
        
        # Get appropriate template
        if response_type in self.response_templates:
            template = self.response_templates[response_type][0]  # Use first template for now
            
            # Customize based on customer history
            if customer_history.get('name'):
                template = f"Habari {customer_history['name']}! " + template
            
            # Fill in business information
            template = template.format(**self.business_info)
            
            return template
        
        return None
    
    def log_interaction(self, customer_phone: str, message_text: str, response: str, response_type: str):
        """Log the interaction for analytics"""
        cursor = self.conn.cursor()
        
        # Insert into messages table
        cursor.execute("""
            INSERT INTO messages (phone_number, message_date, message_type, message_text, chat_session, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (customer_phone, datetime.now(), 'outgoing', response, 'auto_response', 'sent'))
        
        # Update customer last contact
        cursor.execute("""
            UPDATE customers SET last_contact_date = ?, updated_at = CURRENT_TIMESTAMP
            WHERE phone_number = ?
        """, (datetime.now(), customer_phone))
        
        self.conn.commit()
    
    def get_auto_response_stats(self) -> Dict:
        """Get statistics about automated responses"""
        cursor = self.conn.cursor()
        
        # Count automated responses
        cursor.execute("""
            SELECT COUNT(*) FROM messages 
            WHERE chat_session = 'auto_response' AND message_type = 'outgoing'
        """)
        total_responses = cursor.fetchone()[0]
        
        # Count by response type (would need to add response_type column)
        cursor.execute("""
            SELECT COUNT(*) FROM messages 
            WHERE chat_session = 'auto_response' 
            AND message_date >= date('now', '-7 days')
        """)
        recent_responses = cursor.fetchone()[0]
        
        return {
            'total_auto_responses': total_responses,
            'recent_auto_responses': recent_responses
        }
    
    def close(self):
        """Close database connection"""
        self.conn.close()

# Example usage
def main():
    responder = WhatsAppAutoResponder('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db')
    
    # Test with sample messages
    test_messages = [
        "Habari, bei ya iPhone ni ngapi?",
        "Hujambo, tunaweza kupata laptop?",
        "Asante kwa bidhaa",
        "Gharama ya delivery ni ngapi?"
    ]
    
    for message in test_messages:
        response = responder.generate_response(message, "+255714440144")
        print(f"Message: {message}")
        print(f"Response: {response}")
        print("-" * 50)
    
    responder.close()

if __name__ == "__main__":
    main()
