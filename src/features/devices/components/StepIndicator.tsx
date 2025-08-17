import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  steps, 
  currentStep, 
  onStepClick 
}) => {
  const getStepIcon = (step: Step, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle size={20} className="text-green-500" />;
    } else if (step.status === 'active') {
      return <Clock size={20} className="text-blue-500 animate-pulse" />;
    } else if (step.status === 'error') {
      return <Circle size={20} className="text-red-500" />;
    } else {
      return <Circle size={20} className="text-gray-400" />;
    }
  };

  const getStepClasses = (step: Step, index: number) => {
    let baseClasses = "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer";
    
    if (step.status === 'completed') {
      baseClasses += " bg-green-50 border border-green-200 text-green-800";
    } else if (step.status === 'active') {
      baseClasses += " bg-blue-50 border border-blue-200 text-blue-800 shadow-md";
    } else if (step.status === 'error') {
      baseClasses += " bg-red-50 border border-red-200 text-red-800";
    } else {
      baseClasses += " bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100";
    }
    
    return baseClasses;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Repair Progress</h3>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={getStepClasses(step, index)}
          onClick={() => onStepClick?.(index)}
        >
          <div className="flex items-center gap-3">
            {getStepIcon(step, index)}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{step.title}</h4>
              <p className="text-xs opacity-75">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
