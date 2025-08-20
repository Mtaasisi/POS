import { NextRequest, NextResponse } from 'next/server';
import { chromeExtensionService } from '../../../../src/services/chromeExtensionService';

export async function GET(request: NextRequest) {
  try {
    const status = await chromeExtensionService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        isConnected: status.isConnected,
        queueLength: status.queueLength || 0,
        apiKey: status.apiKey ? 'Configured' : 'Not configured',
        lastActivity: status.lastActivity || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get status',
        data: {
          isConnected: false,
          queueLength: 0,
          apiKey: 'Error',
          lastActivity: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
