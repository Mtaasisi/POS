import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const GoogleMapsDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    googleExists: boolean;
    googleMapsExists: boolean;
    apiKeyExists: boolean;
    scriptLoaded: boolean;
    error: string | null;
  }>({
    googleExists: false,
    googleMapsExists: false,
    apiKeyExists: false,
    scriptLoaded: false,
    error: null
  });

  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagnostics({
      googleExists: false,
      googleMapsExists: false,
      apiKeyExists: false,
      scriptLoaded: false,
      error: null
    });

    try {
      // Check if Google object exists
      const googleExists = typeof window !== 'undefined' && 'google' in window;
      
      // Check if Google Maps exists
      const googleMapsExists = googleExists && 'maps' in (window as any).google;
      
      // Check if API key exists
      const apiKeyExists = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      // Check if script is loaded
      const scriptLoaded = document.querySelector('script[src*="maps.googleapis.com"]') !== null;

      setDiagnostics({
        googleExists,
        googleMapsExists,
        apiKeyExists,
        scriptLoaded,
        error: null
      });

      // Test Google Maps API if available
      if (googleMapsExists) {
        try {
          // Try to create a simple map instance
          const testDiv = document.createElement('div');
          testDiv.style.width = '100px';
          testDiv.style.height = '100px';
          document.body.appendChild(testDiv);
          
          const testMap = new (window as any).google.maps.Map(testDiv, {
            center: { lat: 0, lng: 0 },
            zoom: 1
          });
          
          document.body.removeChild(testDiv);
          console.log('✅ Google Maps API test successful');
        } catch (error) {
          console.error('❌ Google Maps API test failed:', error);
          setDiagnostics(prev => ({
            ...prev,
            error: `API test failed: ${error}`
          }));
        }
      }
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      setDiagnostics(prev => ({
        ...prev,
        error: `Diagnostic error: ${error}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Google Maps Diagnostic</h3>
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Google object exists:</span>
          {getStatusIcon(diagnostics.googleExists)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Google Maps exists:</span>
          {getStatusIcon(diagnostics.googleMapsExists)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">API Key configured:</span>
          {getStatusIcon(diagnostics.apiKeyExists)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Script loaded:</span>
          {getStatusIcon(diagnostics.scriptLoaded)}
        </div>
      </div>

      {diagnostics.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{diagnostics.error}</span>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>API Key: {diagnostics.apiKeyExists ? 'Configured' : 'Missing'}</p>
        <p>Environment: {import.meta.env.MODE}</p>
      </div>
    </div>
  );
};

export default GoogleMapsDiagnostic;
