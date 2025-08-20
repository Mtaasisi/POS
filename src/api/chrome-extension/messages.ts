import { NextApiRequest, NextApiResponse } from 'next';
import { chromeExtensionService } from '../../services/chromeExtensionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId, message, type = 'text' } = req.body;

    // Validate required fields
    if (!chatId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: chatId and message are required' 
      });
    }

    // Send message through Chrome extension service
    const success = await chromeExtensionService.sendMessage(chatId, message, type);

    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Message sent successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send message',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
