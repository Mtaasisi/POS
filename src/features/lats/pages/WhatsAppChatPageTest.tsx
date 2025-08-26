import React from 'react';

interface WhatsAppChatPageTestProps {
  instances: any[];
  isDark: boolean;
}

const WhatsAppChatPageTest: React.FC<WhatsAppChatPageTestProps> = ({
  instances,
  isDark
}) => {
  return (
    <div className="h-[90vh] max-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden rounded-2xl">
      <div className="p-4">
        <h1>WhatsApp Chat Page Test</h1>
        <p>Instances: {instances.length}</p>
        <p>Dark mode: {isDark ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default WhatsAppChatPageTest;