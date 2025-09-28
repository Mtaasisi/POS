import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
  X, Stethoscope, CheckCircle, AlertTriangle, Wrench, Package, 
  Camera, Battery, Wifi, Speaker, Monitor, Cpu, HardDrive,
  Smartphone, Laptop, Tablet, Clock, FileText, Lightbulb,
  ArrowRight, ArrowLeft, Play, Pause, RotateCcw, Save
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';

interface DiagnosisModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (deviceId: string, status: DeviceStatus, notes?: string) => void;
}

interface DiagnosticStep {
  id: string;
  title: string;
  description: string;
  category: 'visual' | 'power' | 'hardware' | 'software' | 'connectivity';
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
  notes: string;
  findings: string[];
  recommendations: string[];
  estimatedTime: number; // in minutes
}

interface DiagnosisResult {
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issuesFound: number;
  estimatedRepairCost: number;
  estimatedRepairTime: number;
  partsNeeded: string[];
  recommendations: string[];
  nextSteps: string[];
}

const DiagnosisModal: React.FC<DiagnosisModalProps> = ({
  device,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([]);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize diagnostic steps based on device type
  useEffect(() => {
    if (isOpen && device) {
      initializeDiagnosticSteps();
      setStartTime(new Date());
    }
  }, [isOpen, device]);

  // Timer for diagnosis duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  const initializeDiagnosticSteps = () => {
    const deviceType = getDeviceType(device.model);
    const steps: DiagnosticStep[] = [
      {
        id: 'visual-inspection',
        title: 'Visual Inspection',
        description: 'Examine device for physical damage, wear, and external issues',
        category: 'visual',
        icon: <Monitor className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 5
      },
      {
        id: 'power-test',
        title: 'Power & Battery Test',
        description: 'Test power supply, charging, and battery functionality',
        category: 'power',
        icon: <Battery className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 10
      },
      {
        id: 'display-test',
        title: 'Display & Touch Test',
        description: 'Test screen functionality, touch response, and display quality',
        category: 'hardware',
        icon: <Smartphone className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 8
      },
      {
        id: 'audio-test',
        title: 'Audio System Test',
        description: 'Test speakers, microphone, and audio connectivity',
        category: 'hardware',
        icon: <Speaker className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 5
      },
      {
        id: 'camera-test',
        title: 'Camera Test',
        description: 'Test front and rear cameras, flash, and image quality',
        category: 'hardware',
        icon: <Camera className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 7
      },
      {
        id: 'connectivity-test',
        title: 'Connectivity Test',
        description: 'Test WiFi, Bluetooth, cellular, and other connectivity features',
        category: 'connectivity',
        icon: <Wifi className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 10
      },
      {
        id: 'performance-test',
        title: 'Performance Test',
        description: 'Test CPU, memory, storage, and overall system performance',
        category: 'software',
        icon: <Cpu className="w-5 h-5" />,
        required: true,
        completed: false,
        notes: '',
        findings: [],
        recommendations: [],
        estimatedTime: 15
      }
    ];

    // Add device-specific steps
    if (deviceType === 'laptop') {
      steps.push(
        {
          id: 'keyboard-test',
          title: 'Keyboard & Touchpad Test',
          description: 'Test all keys, touchpad, and input devices',
          category: 'hardware',
          icon: <Laptop className="w-5 h-5" />,
          required: true,
          completed: false,
          notes: '',
          findings: [],
          recommendations: [],
          estimatedTime: 8
        }
      );
    }

    setDiagnosticSteps(steps);
  };

  const getDeviceType = (model: string): 'phone' | 'laptop' | 'tablet' | 'other' => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('laptop') || modelLower.includes('notebook') || modelLower.includes('macbook')) {
      return 'laptop';
    } else if (modelLower.includes('tablet') || modelLower.includes('ipad')) {
      return 'tablet';
    } else if (modelLower.includes('phone') || modelLower.includes('mobile') || modelLower.includes('iphone')) {
      return 'phone';
    }
    return 'other';
  };

  const updateStep = (stepId: string, updates: Partial<DiagnosticStep>) => {
    setDiagnosticSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const completeStep = (stepId: string) => {
    updateStep(stepId, { completed: true });
    
    // Auto-advance to next step if not the last one
    const currentIndex = diagnosticSteps.findIndex(step => step.id === stepId);
    if (currentIndex < diagnosticSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentIndex + 1);
      }, 1000);
    }
  };

  const generateDiagnosisResult = async (): Promise<DiagnosisResult> => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis (replace with actual AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const completedSteps = diagnosticSteps.filter(step => step.completed);
    const totalFindings = completedSteps.reduce((acc, step) => acc + step.findings.length, 0);
    const totalRecommendations = completedSteps.reduce((acc, step) => acc + step.recommendations.length, 0);
    
    // Calculate overall status based on findings
    let overallStatus: DiagnosisResult['overallStatus'] = 'excellent';
    if (totalFindings > 5) overallStatus = 'critical';
    else if (totalFindings > 3) overallStatus = 'poor';
    else if (totalFindings > 1) overallStatus = 'fair';
    else if (totalFindings > 0) overallStatus = 'good';
    
    // Estimate repair cost and time
    const estimatedRepairCost = totalFindings * 15000; // 15,000 TSH per issue
    const estimatedRepairTime = totalFindings * 2; // 2 hours per issue
    
    // Generate parts needed based on findings
    const partsNeeded: string[] = [];
    completedSteps.forEach(step => {
      if (step.findings.some(finding => finding.includes('damaged') || finding.includes('broken'))) {
        if (step.id === 'display-test') partsNeeded.push('Screen Replacement');
        if (step.id === 'camera-test') partsNeeded.push('Camera Module');
        if (step.id === 'audio-test') partsNeeded.push('Speaker Assembly');
        if (step.id === 'power-test') partsNeeded.push('Battery');
      }
    });
    
    const result: DiagnosisResult = {
      overallStatus,
      issuesFound: totalFindings,
      estimatedRepairCost,
      estimatedRepairTime,
      partsNeeded,
      recommendations: completedSteps.flatMap(step => step.recommendations),
      nextSteps: generateNextSteps(overallStatus, totalFindings)
    };
    
    setIsAnalyzing(false);
    return result;
  };

  const generateNextSteps = (status: DiagnosisResult['overallStatus'], issuesFound: number): string[] => {
    const steps: string[] = [];
    
    if (status === 'excellent') {
      steps.push('Device is in excellent condition');
      steps.push('No repairs needed');
      steps.push('Ready for customer pickup');
    } else if (status === 'good') {
      steps.push('Minor issues detected');
      steps.push('Quick maintenance recommended');
      steps.push('Estimate repair cost with customer');
    } else if (status === 'fair') {
      steps.push('Several issues found');
      steps.push('Repair recommended');
      steps.push('Order required parts');
      steps.push('Schedule repair appointment');
    } else if (status === 'poor' || status === 'critical') {
      steps.push('Multiple serious issues detected');
      steps.push('Comprehensive repair needed');
      steps.push('Order all required parts');
      steps.push('Consider device replacement option');
      steps.push('Discuss options with customer');
    }
    
    return steps;
  };

  const handleCompleteDiagnosis = async () => {
    try {
      const result = await generateDiagnosisResult();
      setDiagnosisResult(result);
      
      // Save diagnosis to database
      await supabase.from('device_diagnoses').insert({
        device_id: device.id,
        technician_id: currentUser?.id,
        diagnosis_data: {
          steps: diagnosticSteps,
          result: result,
          duration: elapsedTime,
          completed_at: new Date().toISOString()
        },
        status: 'completed'
      });
      
      toast.success('Diagnosis completed successfully!');
    } catch (error) {
      console.error('Error completing diagnosis:', error);
      toast.error('Failed to complete diagnosis');
    }
  };

  const handleNextStep = () => {
    if (currentStep < diagnosticSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: DiagnosisResult['overallStatus']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  if (!isOpen) return null;

  console.log('[DiagnosisModal] Rendering modal for device:', device.id, 'isOpen:', isOpen);

  const currentDiagnosticStep = diagnosticSteps[currentStep];
  const completedSteps = diagnosticSteps.filter(step => step.completed).length;
  const progress = (completedSteps / diagnosticSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500 text-white">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Device Diagnosis</h2>
                  <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-mono text-lg font-bold text-gray-900">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {completedSteps}/{diagnosticSteps.length} steps</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!diagnosisResult ? (
              <div className="space-y-6">
                {/* Current Step */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    {currentDiagnosticStep?.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentDiagnosticStep?.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {currentDiagnosticStep?.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Estimated time: {currentDiagnosticStep?.estimatedTime} minutes
                  </div>
                </div>

                {/* Step Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Findings</h4>
                    <div className="space-y-2">
                      {currentDiagnosticStep?.findings.map((finding, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{finding}</span>
                        </div>
                      ))}
                      {currentDiagnosticStep?.findings.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No findings recorded yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {currentDiagnosticStep?.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Lightbulb className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                      {currentDiagnosticStep?.recommendations.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No recommendations yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={currentDiagnosticStep?.notes || ''}
                    onChange={(e) => updateStep(currentDiagnosticStep.id, { notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add your observations and notes here..."
                  />
                </div>
              </div>
            ) : (
              /* Diagnosis Results */
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${getStatusColor(diagnosisResult.overallStatus)}`}>
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Diagnosis Complete
                  </h3>
                  <p className="text-gray-600">
                    Overall Status: <span className="font-semibold capitalize">{diagnosisResult.overallStatus}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{diagnosisResult.issuesFound}</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{diagnosisResult.estimatedRepairCost.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Estimated Cost (TSH)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{diagnosisResult.estimatedRepairTime}h</div>
                    <div className="text-sm text-gray-600">Estimated Time</div>
                  </div>
                </div>

                {diagnosisResult.partsNeeded.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Parts Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {diagnosisResult.partsNeeded.map((part, index) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                  <div className="space-y-2">
                    {diagnosisResult.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <GlassButton
                    onClick={handlePreviousStep}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </GlassButton>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!diagnosisResult ? (
                  <>
                    {currentDiagnosticStep && (
                      <GlassButton
                        onClick={() => completeStep(currentDiagnosticStep.id)}
                        variant="primary"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Step
                      </GlassButton>
                    )}
                    
                    {completedSteps === diagnosticSteps.length && (
                      <GlassButton
                        onClick={handleCompleteDiagnosis}
                        variant="primary"
                        className="flex items-center gap-2"
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Complete Diagnosis
                          </>
                        )}
                      </GlassButton>
                    )}
                  </>
                ) : (
                  <GlassButton
                    onClick={() => {
                      onStatusUpdate(device.id, 'awaiting-parts', 'Diagnosis completed - awaiting parts');
                      onClose();
                    }}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Continue to Parts
                  </GlassButton>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DiagnosisModal;
