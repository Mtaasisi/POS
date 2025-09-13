import React, { useState, useEffect } from 'react';
import { runNetworkDiagnostics, getQUICProtocolInfo, generateNetworkReport } from '../utils/networkDiagnostics';
import { NetworkDiagnosticResult } from '../utils/networkDiagnostics';

interface NetworkTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string;
}

export const NetworkTroubleshootingModal: React.FC<NetworkTroubleshootingModalProps> = ({
  isOpen,
  onClose,
  error
}) => {
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'solutions'>('overview');

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await runNetworkDiagnostics();
      setDiagnostics(result);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  const quicInfo = getQUICProtocolInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Network Troubleshooting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'diagnostics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'solutions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Solutions
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">
                  QUIC Protocol Error Detected
                </h3>
                <p className="text-yellow-700 text-sm">
                  {error || 'A network protocol error has occurred. This is usually caused by network instability or browser configuration issues.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Fixes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Refresh the page</li>
                    <li>• Clear browser cache</li>
                    <li>• Try a different browser</li>
                    <li>• Check your internet connection</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Advanced Solutions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Disable QUIC protocol</li>
                    <li>• Use a different network</li>
                    <li>• Try a VPN</li>
                    <li>• Contact support</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Running diagnostics...</p>
                </div>
              ) : diagnostics ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Connection Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${
                          diagnostics.online ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {diagnostics.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {diagnostics.connectionQuality}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {diagnostics.details.effectiveType}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Speed:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {diagnostics.details.downlink} Mbps
                        </span>
                      </div>
                    </div>
                  </div>

                  {diagnostics.issues.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Issues Detected</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {diagnostics.issues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">System Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Platform:</strong> {diagnostics.details.platform}</p>
                      <p><strong>Browser:</strong> {diagnostics.details.userAgent.split(' ').slice(-2).join(' ')}</p>
                      <p><strong>QUIC Supported:</strong> {quicInfo.isSupported ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  Failed to run diagnostics
                </div>
              )}
            </div>
          )}

          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Immediate Actions</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <button
                    onClick={() => window.location.reload()}
                    className="block w-full text-left hover:bg-green-100 p-2 rounded"
                  >
                    1. Refresh Page - Click here to reload
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="block w-full text-left hover:bg-green-100 p-2 rounded"
                  >
                    2. Clear Cache & Reload - Click here
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Browser-Specific Solutions</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  {quicInfo.recommendations.map((rec, index) => (
                    <div key={index} className="p-2 bg-blue-100 rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">General Troubleshooting</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Check your internet connection</li>
                  <li>Try using a different network (mobile hotspot, different WiFi)</li>
                  <li>Disable VPN if you're using one</li>
                  <li>Try a different browser</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Restart your browser</li>
                  <li>Check if your firewall is blocking the connection</li>
                  <li>Contact your network administrator if on a corporate network</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkTroubleshootingModal;
