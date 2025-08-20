import { NextRequest, NextResponse } from 'next/server';
import { chromeExtensionService } from '../../../src/services/chromeExtensionService';

export async function POST(request: NextRequest) {
  console.log('🔍 Chrome extension webhook received');

  try {
    const webhookData = await request.json();
    
    // Validate webhook data
    if (!webhookData || !webhookData.type) {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    // Process the webhook through Chrome extension service
    await chromeExtensionService.processIncomingMessage({
      type: webhookData.type,
      data: webhookData.data || webhookData,
      timestamp: webhookData.timestamp || Date.now(),
      chatId: webhookData.chatId,
      customerId: webhookData.customerId
    });

    // Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Chrome extension webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Chrome extension webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
