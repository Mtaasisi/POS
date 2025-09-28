#!/usr/bin/env python3
"""
WhatsApp Business API Integration
Handles real-time WhatsApp message processing and automated responses
"""

import sqlite3
import json
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional
import logging

class WhatsAppIntegration:
    def __init__(self, db_path, access_token=None, phone_number_id=None):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        
        # WhatsApp Business API credentials
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.api_url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        
        # Setup logging
        logging.basicConfig(
            filename='/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/logs/whatsapp.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def process_incoming_message(self, message_data: Dict) -> Dict:
        """Process incoming WhatsApp message"""
        try:
            # Extract message details
            phone_number = message_data.get('from')
            message_text = message_data.get('text', {}).get('body', '')
            message_id = message_data.get('id')
            timestamp = message_data.get('timestamp')
            
            # Log the message
            self.logger.info(f"Received message from {phone_number}: {message_text}")
            
            # Save to database
            self._save_message(phone_number, message_text, 'incoming', message_id, timestamp)
            
            # Update customer record
            self._update_customer_record(phone_number, message_text)
            
            # Generate automated response
            response = self._generate_auto_response(phone_number, message_text)
            
            if response:
                # Send response
                self.send_message(phone_number, response)
                
                # Log response
                self.logger.info(f"Sent auto-response to {phone_number}: {response}")
            
            return {
                'status': 'success',
                'message_id': message_id,
                'response_sent': bool(response)
            }
            
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _save_message(self, phone_number: str, message_text: str, message_type: str, message_id: str, timestamp: str):
        """Save message to database"""
        cursor = self.conn.cursor()
        
        # Convert timestamp
        message_date = datetime.fromtimestamp(int(timestamp))
        
        cursor.execute("""
            INSERT INTO messages (phone_number, message_date, message_type, message_text, chat_session, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (phone_number, message_date, message_type, message_text, 'whatsapp_api', 'received'))
        
        self.conn.commit()
    
    def _update_customer_record(self, phone_number: str, message_text: str):
        """Update customer record with new message"""
        cursor = self.conn.cursor()
        
        # Check if customer exists
        cursor.execute("SELECT id FROM customers WHERE phone_number = ?", (phone_number,))
        customer = cursor.fetchone()
        
        if customer:
            # Update existing customer
            cursor.execute("""
                UPDATE customers 
                SET total_messages = total_messages + 1, 
                    last_contact_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE phone_number = ?
            """, (phone_number,))
        else:
            # Create new customer
            cursor.execute("""
                INSERT INTO customers (phone_number, name, customer_type, segment, total_messages, first_contact_date, last_contact_date)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (phone_number, 'New Customer', 'individual', 'prospect', 1))
        
        self.conn.commit()
    
    def _generate_auto_response(self, phone_number: str, message_text: str) -> Optional[str]:
        """Generate automated response using the auto-responder"""
        try:
            from auto_responses import WhatsAppAutoResponder
            
            responder = WhatsAppAutoResponder(self.db_path)
            response = responder.generate_response(message_text, phone_number)
            responder.close()
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error generating auto-response: {e}")
            return None
    
    def send_message(self, to_phone: str, message_text: str) -> Dict:
        """Send message via WhatsApp Business API"""
        if not self.access_token or not self.phone_number_id:
            self.logger.warning("WhatsApp API credentials not configured")
            return {'status': 'error', 'error': 'API credentials not configured'}
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messaging_product': 'whatsapp',
            'to': to_phone,
            'type': 'text',
            'text': {'body': message_text}
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                message_id = result.get('messages', [{}])[0].get('id')
                
                # Save outgoing message
                self._save_message(to_phone, message_text, 'outgoing', message_id, str(int(time.time())))
                
                return {'status': 'success', 'message_id': message_id}
            else:
                self.logger.error(f"Failed to send message: {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            self.logger.error(f"Error sending message: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def send_bulk_messages(self, recipients: List[str], message_text: str) -> Dict:
        """Send bulk messages for marketing campaigns"""
        results = {
            'success': [],
            'failed': []
        }
        
        for phone in recipients:
            result = self.send_message(phone, message_text)
            
            if result['status'] == 'success':
                results['success'].append(phone)
            else:
                results['failed'].append({'phone': phone, 'error': result.get('error')})
            
            # Rate limiting - wait 1 second between messages
            time.sleep(1)
        
        return results
    
    def send_campaign_messages(self, campaign_data: Dict) -> Dict:
        """Send marketing campaign messages"""
        try:
            from marketing_automation import MarketingAutomation
            
            automation = MarketingAutomation(self.db_path)
            
            # Get target customers
            target_customers = campaign_data.get('target_customers', [])
            template = campaign_data.get('template', {})
            
            results = {
                'sent': 0,
                'failed': 0,
                'details': []
            }
            
            for customer in target_customers:
                phone = customer[0]  # phone_number is first element
                name = customer[1]   # name is second element
                
                # Personalize message
                personalized_message = automation.personalize_message(
                    template, customer, campaign_data.get('product_info', {})
                )
                
                # Send message
                result = self.send_message(phone, personalized_message)
                
                if result['status'] == 'success':
                    results['sent'] += 1
                    results['details'].append({
                        'phone': phone,
                        'name': name,
                        'status': 'sent'
                    })
                else:
                    results['failed'] += 1
                    results['details'].append({
                        'phone': phone,
                        'name': name,
                        'status': 'failed',
                        'error': result.get('error')
                    })
                
                # Rate limiting
                time.sleep(1)
            
            automation.close()
            return results
            
        except Exception as e:
            self.logger.error(f"Error sending campaign: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def get_message_statistics(self) -> Dict:
        """Get message statistics"""
        cursor = self.conn.cursor()
        
        # Total messages
        cursor.execute("SELECT COUNT(*) FROM messages")
        total_messages = cursor.fetchone()[0]
        
        # Messages by type
        cursor.execute("""
            SELECT message_type, COUNT(*) 
            FROM messages 
            GROUP BY message_type
        """)
        messages_by_type = dict(cursor.fetchall())
        
        # Recent activity
        cursor.execute("""
            SELECT COUNT(*) FROM messages 
            WHERE message_date >= date('now', '-24 hours')
        """)
        recent_messages = cursor.fetchone()[0]
        
        # Auto-responses sent
        cursor.execute("""
            SELECT COUNT(*) FROM messages 
            WHERE chat_session = 'auto_response' AND message_type = 'outgoing'
        """)
        auto_responses = cursor.fetchone()[0]
        
        return {
            'total_messages': total_messages,
            'messages_by_type': messages_by_type,
            'recent_messages_24h': recent_messages,
            'auto_responses_sent': auto_responses
        }
    
    def setup_webhook(self, webhook_url: str, verify_token: str) -> Dict:
        """Setup webhook for receiving messages"""
        # This would typically be done through Facebook Developer Console
        # But we can provide the configuration details
        
        webhook_config = {
            'url': webhook_url,
            'verify_token': verify_token,
            'fields': ['messages', 'message_deliveries', 'message_reads'],
            'webhook_events': [
                'messages',
                'message_deliveries', 
                'message_reads'
            ]
        }
        
        self.logger.info(f"Webhook configuration: {webhook_config}")
        
        return {
            'status': 'configured',
            'config': webhook_config,
            'instructions': 'Configure this in Facebook Developer Console'
        }
    
    def close(self):
        """Close database connection"""
        self.conn.close()

# Webhook handler for Flask/FastAPI
def create_webhook_handler():
    """Create webhook handler for receiving messages"""
    webhook_code = '''
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

# Initialize WhatsApp integration
whatsapp = WhatsAppIntegration(
    '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db',
    access_token='YOUR_ACCESS_TOKEN',
    phone_number_id='YOUR_PHONE_NUMBER_ID'
)

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        # Webhook verification
        verify_token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        
        if verify_token == 'YOUR_VERIFY_TOKEN':
            return challenge
        else:
            return 'Verification failed', 403
    
    elif request.method == 'POST':
        # Process incoming message
        data = request.get_json()
        
        if data.get('object') == 'whatsapp_business_account':
            for entry in data.get('entry', []):
                for change in entry.get('changes', []):
                    if change.get('field') == 'messages':
                        for message in change.get('value', {}).get('messages', []):
                            result = whatsapp.process_incoming_message(message)
                            print(f"Processed message: {result}")
        
        return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
'''
    
    with open('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/automation/webhook_handler.py', 'w') as f:
        f.write(webhook_code)
    
    return webhook_code

# Example usage
def main():
    # Initialize WhatsApp integration
    whatsapp = WhatsAppIntegration(
        '/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db'
    )
    
    # Get statistics
    stats = whatsapp.get_message_statistics()
    print(f"Message Statistics: {stats}")
    
    # Setup webhook
    webhook_config = whatsapp.setup_webhook(
        'https://your-domain.com/webhook',
        'your_verify_token'
    )
    print(f"Webhook Config: {webhook_config}")
    
    whatsapp.close()

if __name__ == "__main__":
    main()
