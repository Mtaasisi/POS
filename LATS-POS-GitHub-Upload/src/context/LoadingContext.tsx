import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingJob {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  timestamp: number;
  error?: string;
}

interface LoadingContextType {
  jobs: LoadingJob[];
  addJob: (title: string) => string;
  updateJob: (jobId: string, updates: Partial<LoadingJob>) => void;
  removeJob: (jobId: string) => void;
  cancelJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  clearAllJobs: () => void;
  isVisible: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<LoadingJob[]>([]);

  const addJob = useCallback((title: string): string => {
    const jobId = `${title}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newJob: LoadingJob = {
      id: jobId,
      title,
      status: 'pending',
      progress: 0,
      timestamp: Date.now()
    };

    setJobs(prev => [...prev, newJob]);
    return jobId;
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<LoadingJob>) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const cancelJob = useCallback((jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId && job.status === 'pending' 
        ? { ...job, status: 'failed', error: 'Cancelled by user' }
        : job
    ));
  }, []);

  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => 
      job.status !== 'completed' && job.status !== 'failed'
    ));
  }, []);

  const clearAllJobs = useCallback(() => {
    setJobs([]);
  }, []);

  const isVisible = jobs.length > 0;

  const value: LoadingContextType = {
    jobs,
    addJob,
    updateJob,
    removeJob,
    cancelJob,
    clearCompletedJobs,
    clearAllJobs,
    isVisible
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingProvider; 
