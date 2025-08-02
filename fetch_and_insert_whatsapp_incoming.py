import os
import requests
from supabase import create_client, Client
from datetime import datetime
import time

# Config
RECEIVE_URL = "https://7105.api.greenapi.com/waInstance7105284900/receiveNotification/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294"
DELETE_URL_BASE = "https://7105.api.greenapi.com/waInstance7105284900/deleteNotification/b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294/"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Starting WhatsApp notification poller. Press Ctrl+C to stop.")
try:
    while True:
        response = requests.get(RECEIVE_URL)
        if response.status_code != 200:
            print(f"Failed to fetch notification: {response.status_code}")
            time.sleep(2)
            continue
        data = response.json()
        print('Raw Green API notification:')
        print(data)
        if not data or data is None:
            print("No new notifications.")
            time.sleep(2)
            continue
        body = data.get('body', {})
        receipt_id = data.get('receiptId')
        if body.get('typeWebhook') == 'incomingMessageReceived':
            msg = body
            sender = msg.get('senderData', {}).get('sender')
            chat_id_whatsapp = msg.get('senderData', {}).get('chatId')
            recipient = msg.get('instanceData', {}).get('wid')
            type_ = msg.get('messageData', {}).get('typeMessage', 'textMessage')
            content = ''
            if type_ == 'textMessage':
                content = msg.get('messageData', {}).get('textMessageData', {}).get('textMessage', '')
            elif type_ == 'extendedTextMessage':
                content = msg.get('messageData', {}).get('extendedTextMessageData', {}).get('text', '')
            else:
                content = str(msg.get('messageData', {}))
            status = 'sent'
            timestamp = datetime.utcfromtimestamp(msg.get('timestamp', datetime.utcnow().timestamp())).isoformat()
            # Find chat UUID in whatsapp_chats where participants contains sender
            chat_lookup = supabase.table('whatsapp_chats').select('id').contains('participants', [sender]).maybe_single().execute()
            chat_uuid = None
            if chat_lookup and chat_lookup.data:
                chat_uuid = chat_lookup.data['id']
            else:
                print(f"No chat found for sender {sender}, creating new chat.")
                new_chat = supabase.table('whatsapp_chats').insert({
                    'participants': [sender],
                    'unread_count': 1
                }).execute()
                if new_chat and new_chat.data and len(new_chat.data) > 0:
                    chat_uuid = new_chat.data[0]['id']
                else:
                    print(f"Failed to create chat for sender {sender}, skipping message.")
                    time.sleep(2)
                    continue
            # Insert message
            data = {
                "chat_id": chat_uuid,
                "sender": sender,
                "recipient": recipient,
                "content": content,
                "type": "text" if type_ == 'textMessage' else type_,
                "status": status,
                "timestamp": timestamp,
            }
            print('Inserting message:', data)
            supabase.table("whatsapp_messages").insert(data).execute()
            print('Inserted message.')
        elif body.get('typeWebhook') == 'incomingButtonResponse':
            # Handle button response
            print('Processing incoming button response...')
            msg = body
            sender = msg.get('senderData', {}).get('sender')
            chat_id_whatsapp = msg.get('senderData', {}).get('chatId')
            timestamp = datetime.utcfromtimestamp(msg.get('timestamp', datetime.utcnow().timestamp())).isoformat()
            button_id = msg.get('buttonResponseData', {}).get('buttonId')
            button_text = msg.get('buttonResponseData', {}).get('buttonText')
            # Find chat UUID in whatsapp_chats where participants contains sender
            chat_lookup = supabase.table('whatsapp_chats').select('id').contains('participants', [sender]).maybe_single().execute()
            chat_uuid = None
            if chat_lookup.data:
                chat_uuid = chat_lookup.data['id']
            else:
                print(f"No chat found for sender {sender}, creating new chat.")
                new_chat = supabase.table('whatsapp_chats').insert({
                    'participants': [sender],
                    'unread_count': 1
                }).execute()
                if new_chat.data and len(new_chat.data) > 0:
                    chat_uuid = new_chat.data[0]['id']
                else:
                    print(f"Failed to create chat for sender {sender}, skipping button response.")
                    time.sleep(2)
                    continue
            # Insert button response
            data = {
                "chat_id": chat_uuid,
                "sender": sender,
                "button_id": button_id,
                "button_text": button_text,
                "timestamp": timestamp,
                "raw_data": msg
            }
            print('Inserting button response:', data)
            supabase.table("whatsapp_button_responses").insert(data).execute()
            print('Inserted button response.')
        else:
            print('Notification is not an incoming message or button response, skipping.')
        # Delete notification from Green API queue
        if receipt_id:
            del_url = DELETE_URL_BASE + str(receipt_id)
            del_resp = requests.delete(del_url)
            print(f"Deleted notification {receipt_id}, status: {del_resp.status_code}")
        time.sleep(2)
except KeyboardInterrupt:
    print("\nStopped WhatsApp notification poller.") 