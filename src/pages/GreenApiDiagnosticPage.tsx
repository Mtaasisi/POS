import React from 'react';
import GreenApiDiagnostic from '../components/GreenApiDiagnostic';

const GreenApiDiagnosticPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Green API Diagnostic Tool</h1>
          <p className="text-gray-600">
            Use this tool to diagnose and troubleshoot Green API connection issues. 
            It will test multiple connection methods and provide detailed recommendations.
          </p>
        </div>
        
        <GreenApiDiagnostic />
        
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Tips</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• If all proxy methods fail but direct API works, the issue is with your proxy setup</li>
            <li>• If RLS queries fail, run the RLS fix script in your Supabase SQL Editor</li>
            <li>• If no methods work, check your internet connection and Green API service status</li>
            <li>• For production issues, ensure your Netlify functions are properly deployed</li>
            <li>• Check the browser console for additional error details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GreenApiDiagnosticPage;
