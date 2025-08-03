import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassButton from '../ui/GlassButton';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';

const POSNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isTouchMode = location.pathname === '/pos/touch';
  
  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="flex items-center gap-2">
        <GlassButton
          onClick={() => navigate('/pos')}
          variant={!isTouchMode ? 'default' : 'outline'}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Desktop POS
        </GlassButton>
        
        <GlassButton
          onClick={() => navigate('/pos/touch')}
          variant={isTouchMode ? 'default' : 'outline'}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Touch POS
        </GlassButton>
        
        <GlassButton
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="px-4 py-2 border-gray-300 text-gray-600 hover:border-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </GlassButton>
      </div>
    </div>
  );
};

export default POSNavigation; 