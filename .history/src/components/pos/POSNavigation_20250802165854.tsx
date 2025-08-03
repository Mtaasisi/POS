import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import {
  Smartphone,
  Monitor,
  Settings,
  ArrowLeft
} from 'lucide-react';

const POSNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isTouchMode = location.pathname === '/touch-pos';
  const isRegularMode = location.pathname === '/pos';

  const switchToTouchMode = () => {
    navigate('/touch-pos');
  };

  const switchToRegularMode = () => {
    navigate('/pos');
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="fixed top-6 left-6 z-50 flex gap-4">
      {/* Back Button */}
      <TouchOptimizedButton
        onClick={goBack}
        variant="secondary"
        size="md"
        icon={ArrowLeft}
        className="w-16 h-16 rounded-full"
      >
        Back
      </TouchOptimizedButton>

      {/* Mode Switch Buttons */}
      <div className="flex gap-4">
        <TouchOptimizedButton
          onClick={switchToRegularMode}
          variant={isRegularMode ? 'primary' : 'secondary'}
          size="md"
          icon={Monitor}
          className="w-16 h-16 rounded-full"
        >
          Desktop
        </TouchOptimizedButton>

        <TouchOptimizedButton
          onClick={switchToTouchMode}
          variant={isTouchMode ? 'primary' : 'secondary'}
          size="md"
          icon={Smartphone}
          className="w-16 h-16 rounded-full"
        >
          Touch
        </TouchOptimizedButton>
      </div>
    </div>
  );
};

export default POSNavigation; 