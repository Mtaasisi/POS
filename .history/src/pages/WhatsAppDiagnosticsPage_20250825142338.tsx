import React from 'react';
import WhatsAppConnectionTest from '../components/WhatsAppConnectionTest';

const WhatsAppDiagnosticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Connection Diagnostics
          </h1>
          <p className="text-gray-600">
            Test and diagnose WhatsApp API connections and Supabase connectivity issues.
          </p>
        </div>
        
        <WhatsAppConnectionTest />
      </div>
    </div>
  );
};

export default WhatsAppDiagnosticsPage;
