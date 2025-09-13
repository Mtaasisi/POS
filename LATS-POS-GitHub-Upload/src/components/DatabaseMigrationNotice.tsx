import React from 'react';
import { AlertTriangle, ExternalLink, Database } from 'lucide-react';

const DatabaseMigrationNotice: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database size={40} className="text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Database Setup Required</h1>
          <p className="text-gray-600 text-lg">
            The WhatsApp Connection Manager needs database tables to be created first.
          </p>
        </div>

        {/* Alert Box */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Quick Setup Required</h3>
              <p className="text-orange-800 text-sm mb-4">
                Your WhatsApp Connection Manager is ready, but needs database tables to store your instances and settings.
              </p>
              <div className="bg-white border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Ready-to-use SQL file created:</h4>
                <code className="text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  database-migration.sql
                </code>
                <p className="text-sm text-gray-600 mt-2">
                  This file is in your project root and contains all the necessary SQL.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Copy the SQL Content
            </h3>
            <div className="space-y-3">
              <p className="text-blue-800 text-sm">
                Open the <code className="bg-blue-100 px-2 py-1 rounded text-xs">database-migration.sql</code> file in your project root and copy all the SQL content.
              </p>
              <div className="bg-white border border-blue-200 rounded-lg p-3">
                <code className="text-xs text-gray-700 block">
                  -- WhatsApp Connection Manager Database Migration<br/>
                  -- Copy and paste this entire SQL into your Supabase Dashboard SQL Editor<br/>
                  <br/>
                  CREATE TABLE IF NOT EXISTS whatsapp_instances_comprehensive (...<br/>
                  <span className="text-gray-500">... and more tables, policies, and indexes</span>
                </code>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Run in Supabase Dashboard
            </h3>
            <div className="space-y-3">
              <p className="text-green-800 text-sm">
                Go to your Supabase SQL Editor and paste the SQL content.
              </p>
              <a
                href="https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <ExternalLink size={18} />
                Open Supabase SQL Editor
              </a>
              <p className="text-green-700 text-xs">
                This will open your Supabase project's SQL editor in a new tab.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Refresh and Start Using
            </h3>
            <p className="text-purple-800 text-sm mb-3">
              After running the SQL, refresh this page and you'll see the full WhatsApp Connection Manager with:
            </p>
            <ul className="text-purple-700 text-sm space-y-1 ml-4">
              <li>• Multi-instance management with visual dashboards</li>
              <li>• QR code generation for device authorization</li>
              <li>• Comprehensive webhook and notification settings</li>
              <li>• Real-time connection monitoring and activity logs</li>
              <li>• Complete manual control over all Green API endpoints</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            This is a one-time setup. Once completed, you'll have full access to the WhatsApp Connection Manager.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMigrationNotice;
