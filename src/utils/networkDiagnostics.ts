import { checkNetworkStatus, getConnectionQuality } from '../lib/customerApi/core';

export interface NetworkDiagnosticResult {
  timestamp: string;
  online: boolean;
  connectionQuality: string;
  issues: string[];
  recommendations: string[];
  details: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    userAgent: string;
    platform: string;
  };
}

export async function runNetworkDiagnostics(): Promise<NetworkDiagnosticResult> {
  const result: NetworkDiagnosticResult = {
    timestamp: new Date().toISOString(),
    online: navigator.onLine,
    connectionQuality: 'unknown',
    issues: [],
    recommendations: [],
    details: {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }
  };

  // Check network status
  const networkStatus = checkNetworkStatus();
  const quality = getConnectionQuality();
  
  result.connectionQuality = quality.quality;
  result.details = {
    ...result.details,
    effectiveType: networkStatus.effectiveType,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt,
    saveData: networkStatus.saveData
  };

  // Identify potential issues
  if (!result.online) {
    result.issues.push('No internet connection detected');
    result.recommendations.push('Check your internet connection and try again');
  }

  if (quality.quality === 'poor') {
    result.issues.push('Poor connection quality detected');
    result.recommendations.push('Try moving closer to your WiFi router or switch to a different network');
  }

  if (networkStatus.rtt > 200) {
    result.issues.push('High latency detected (RTT > 200ms)');
    result.recommendations.push('High latency may cause connection issues. Try using a wired connection if possible');
  }

  if (networkStatus.downlink < 1) {
    result.issues.push('Very slow download speed detected');
    result.recommendations.push('Slow connection may cause timeout issues. Consider upgrading your connection');
  }

  // Check for browser-specific issues
  const isChrome = navigator.userAgent.includes('Chrome');
  const isFirefox = navigator.userAgent.includes('Firefox');
  const isSafari = navigator.userAgent.includes('Safari');

  if (isChrome) {
    result.recommendations.push('For Chrome users: Try disabling QUIC protocol in chrome://flags/#enable-quic');
  }

  if (isFirefox) {
    result.recommendations.push('For Firefox users: Try disabling HTTP/3 in about:config (network.http.http3.enabled)');
  }

  // Test basic connectivity
  try {
    const testResponse = await fetch('https://httpbin.org/get', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      timeout: 5000
    });
    
    if (!testResponse.ok) {
      result.issues.push('Basic connectivity test failed');
      result.recommendations.push('Check if your firewall or antivirus is blocking connections');
    }
  } catch (error) {
    result.issues.push('Basic connectivity test failed');
    result.recommendations.push('Network connectivity issues detected. Check your internet connection');
  }

  return result;
}

export function getQUICProtocolInfo(): {
  isSupported: boolean;
  isEnabled: boolean;
  recommendations: string[];
} {
  const result = {
    isSupported: false,
    isEnabled: false,
    recommendations: [] as string[]
  };

  // Check if QUIC is supported (basic check)
  result.isSupported = 'connection' in navigator;
  
  // Browser-specific recommendations
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    result.recommendations.push(
      'Chrome: Disable QUIC by going to chrome://flags/#enable-quic and setting it to "Disabled"',
      'Chrome: Try chrome://net-internals/#quic to see QUIC connections'
    );
  } else if (userAgent.includes('firefox')) {
    result.recommendations.push(
      'Firefox: Disable HTTP/3 by going to about:config and setting network.http.http3.enabled to false'
    );
  } else if (userAgent.includes('safari')) {
    result.recommendations.push(
      'Safari: Try disabling "Prevent cross-site tracking" in Safari preferences'
    );
  }

  return result;
}

export function generateNetworkReport(): string {
  const diagnostics = runNetworkDiagnostics();
  const quicInfo = getQUICProtocolInfo();
  
  return `
Network Diagnostics Report
==========================

Timestamp: ${new Date().toLocaleString()}
Online: ${navigator.onLine ? 'Yes' : 'No'}
Connection Quality: ${getConnectionQuality().quality}
User Agent: ${navigator.userAgent}

QUIC Protocol Info:
- Supported: ${quicInfo.isSupported ? 'Yes' : 'No'}
- Enabled: ${quicInfo.isEnabled ? 'Yes' : 'No'}

Recommendations:
${quicInfo.recommendations.map(rec => `- ${rec}`).join('\n')}

To resolve QUIC protocol errors:
1. Try refreshing the page
2. Clear browser cache and cookies
3. Try a different browser
4. Check your internet connection
5. Disable QUIC/HTTP3 in your browser settings
6. Try using a VPN or different network
  `.trim();
}

// Export for use in components
export { runNetworkDiagnostics as default };
