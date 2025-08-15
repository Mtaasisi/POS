import { useCallback } from 'react';

export const useLoadingOperations = () => {
  // Generic async operation with loading
  const withLoading = useCallback(async <T,>(
    title: string,
    operation: () => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    console.log(`Starting operation: ${title}`);
    
    try {
      // Start processing
      onProgress?.(10);

      const result = await operation();
      
      // Complete successfully
      onProgress?.(100);
      console.log(`Completed operation: ${title}`);
      
      return result;
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Operation failed: ${title} - ${errorMessage}`);
      
      throw error;
    }
  }, []);

  // Data fetching with loading
  const fetchWithLoading = useCallback(async <T,>(
    title: string,
    fetchOperation: () => Promise<T>
  ): Promise<T> => {
    return withLoading(title, fetchOperation, (progress) => {
      console.log(`Fetch progress: ${progress}%`);
    });
  }, [withLoading]);

  // File upload with loading
  const uploadWithLoading = useCallback(async <T,>(
    title: string,
    uploadOperation: (onProgress: (progress: number) => void) => Promise<T>
  ): Promise<T> => {
    console.log(`Starting upload: ${title}`);
    
    try {
      const result = await uploadOperation((progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      console.log(`Completed upload: ${title}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error(`Upload failed: ${title} - ${errorMessage}`);
      throw error;
    }
  }, []);

  // Batch operations with loading
  const batchWithLoading = useCallback(async <T,>(
    title: string,
    operations: Array<{ name: string; operation: () => Promise<T> }>
  ): Promise<T[]> => {
    console.log(`Starting batch operation: ${title}`);
    const results: T[] = [];
    
    try {
      for (let i = 0; i < operations.length; i++) {
        const { name, operation } = operations[i];
        const progress = Math.round(((i + 1) / operations.length) * 100);
        
        console.log(`Batch progress: ${progress}% - ${name}`);
        
        const result = await operation();
        results.push(result);
      }
      
      console.log(`Completed batch operation: ${title}`);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch operation failed';
      console.error(`Batch operation failed: ${title} - ${errorMessage}`);
      throw error;
    }
  }, []);

  // Search with loading
  const searchWithLoading = useCallback(async <T,>(
    title: string,
    searchOperation: () => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    console.log(`Starting search: ${title}`);
    
    try {
      onProgress?.(0);
      
      const result = await searchOperation();
      
      onProgress?.(100);
      console.log(`Completed search: ${title}`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      console.error(`Search failed: ${title} - ${errorMessage}`);
      throw error;
    }
  }, []);

  return {
    withLoading,
    fetchWithLoading,
    uploadWithLoading,
    batchWithLoading,
    searchWithLoading
  };
};
