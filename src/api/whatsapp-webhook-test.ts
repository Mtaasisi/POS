import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 WhatsApp Webhook Test Endpoint Called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);

  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    console.log('Test verification parameters:', {
      mode,
      token: token ? '***' + token.slice(-4) : 'not provided',
      challenge,
      hasToken: !!token,
      hasChallenge: !!challenge
    });

    // Simple verification - accept any token for testing
    if (mode === 'subscribe' && token && challenge) {
      console.log('✅ Test verification successful');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Test verification failed - missing parameters');
      return res.status(400).send('Missing required parameters');
    }
  }

  if (req.method === 'POST') {
    console.log('📨 Test webhook POST received');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    return res.status(200).send('OK');
  }

  return res.status(405).send('Method Not Allowed');
}
