import { NextRequest, NextResponse } from 'next/server';
import { chromeExtensionService } from '../../../../src/services/chromeExtensionService';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, type = 'text' } = await request.json();
    
    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId and message' },
        { status: 400 }
      );
    }

    const result = await chromeExtensionService.sendMessage({
      chatId,
      message,
      type
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
