import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LoadingJob {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  timestamp: number;
  error?: string;
}

interface GlobalLoadingProgressProps {
  isVisible: boolean;
  jobs?: LoadingJob[];
  onCancel?: (jobId: string) => void;
  className?: string;
}

const GlobalLoadingProgress: React.FC<GlobalLoadingProgressProps> = ({
  isVisible,
  jobs = [],
  onCancel,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Calculate overall progress based on all jobs
  useEffect(() => {
    if (jobs.length === 0) {
      setOverallProgress(0);
      return;
    }

    const totalProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
    const averageProgress = totalProgress / jobs.length;
    setOverallProgress(Math.round(averageProgress));
  }, [jobs]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    const hasFailed = jobs.some(job => job.status === 'failed');
    const allCompleted = jobs.length > 0 && jobs.every(job => job.status === 'completed');
    const isProcessing = jobs.some(job => job.status === 'processing');
    const isPending = jobs.some(job => job.status === 'pending');

    if (hasFailed) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (allCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (isProcessing) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    } else if (isPending) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
  };

  const getStatusText = () => {
    const hasFailed = jobs.some(job => job.status === 'failed');
    const allCompleted = jobs.length > 0 && jobs.every(job => job.status === 'completed');
    const isProcessing = jobs.some(job => job.status === 'processing');
    const isPending = jobs.some(job => job.status === 'pending');

    if (hasFailed) {
      return 'Some operations failed';
    } else if (allCompleted) {
      return 'All operations completed';
    } else if (isProcessing) {
      return 'Processing...';
    } else if (isPending) {
      return 'Queued for processing';
    }
    return 'Loading...';
  };

  const getStatusColor = () => {
    const hasFailed = jobs.some(job => job.status === 'failed');
    const allCompleted = jobs.length > 0 && jobs.every(job => job.status === 'completed');
    const isProcessing = jobs.some(job => job.status === 'processing');

    if (hasFailed) {
      return 'text-red-600';
    } else if (allCompleted) {
      return 'text-green-600';
    } else if (isProcessing) {
      return 'text-blue-600';
    }
    return 'text-yellow-600';
  };

  const activeJobs = jobs.filter(job => job.status !== 'completed' && job.status !== 'failed');

  return (
    <div className={`fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-4 min-w-80 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {jobs.length > 0 && (
              <span className="text-xs text-gray-500">
                {jobs.length} operation{jobs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeJobs.length > 0 && onCancel && (
            <button
              onClick={() => activeJobs.forEach(job => onCancel(job.id))}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Cancel All
            </button>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {jobs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Overall Progress</span>
            <span className="text-xs text-gray-600">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Individual Job Details */}
      {showDetails && jobs.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {jobs.map((job) => (
            <div key={job.id} className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 truncate">
                  {job.title}
                </span>
                <div className="flex items-center gap-1">
                  {job.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                  {job.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                  {job.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {job.status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                  <span className="text-xs text-gray-500">{job.progress}%</span>
                </div>
              </div>
              
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    job.status === 'failed' 
                      ? 'bg-red-500' 
                      : job.status === 'completed' 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              
              {job.error && (
                <p className="text-xs text-red-600 mt-1">{job.error}</p>
              )}
              
              {job.status === 'pending' && onCancel && (
                <button
                  onClick={() => onCancel(job.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto-hide when all completed */}
      {jobs.length > 0 && jobs.every(job => job.status === 'completed') && (
        <div className="mt-2 text-xs text-green-600 text-center">
          All operations completed successfully
        </div>
      )}
    </div>
  );
};

export default GlobalLoadingProgress;
