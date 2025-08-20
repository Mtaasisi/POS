import { NextApiRequest, NextApiResponse } from 'next';
import { chromeExtensionService } from '../../services/chromeExtensionService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get connection status from Chrome extension service
    const status = chromeExtensionService.getConnectionStatus();

    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
