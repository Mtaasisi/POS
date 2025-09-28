import { useState, useEffect, useCallback } from 'react';

interface GridConfig {
  minCardWidth: number;
  maxColumns: number;
  gap: number;
  containerPadding: number;
}

interface UseDynamicGridOptions {
  containerRef?: React.RefObject<HTMLElement>;
  minCardWidth?: number;
  maxColumns?: number;
  gap?: number;
  containerPadding?: number;
}

export const useDynamicGrid = (options: UseDynamicGridOptions = {}) => {
  const {
    containerRef,
    minCardWidth = 200,
    maxColumns = 8,
    gap = 16,
    containerPadding = 32
  } = options;

  const [gridConfig, setGridConfig] = useState<GridConfig>({
    minCardWidth,
    maxColumns,
    gap,
    containerPadding
  });

  const [columns, setColumns] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const calculateColumns = useCallback((width: number) => {
    const availableWidth = width - containerPadding;
    const cardWidthWithGap = minCardWidth + gap;
    const calculatedColumns = Math.floor(availableWidth / cardWidthWithGap);
    
    // Ensure we don't exceed max columns and have at least 1 column
    const finalColumns = Math.max(1, Math.min(calculatedColumns, maxColumns));
    
    return finalColumns;
  }, [minCardWidth, maxColumns, gap, containerPadding]);

  const updateGrid = useCallback(() => {
    if (containerRef?.current) {
      const width = containerRef.current.offsetWidth;
      setContainerWidth(width);
      const newColumns = calculateColumns(width);
      setColumns(newColumns);
    } else {
      // Fallback to window width if no container ref
      const width = window.innerWidth;
      setContainerWidth(width);
      const newColumns = calculateColumns(width);
      setColumns(newColumns);
    }
  }, [containerRef, calculateColumns]);

  useEffect(() => {
    // Initial calculation
    updateGrid();

    // Set up resize observer for container
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef?.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateGrid();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback to window resize listener
      window.addEventListener('resize', updateGrid);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateGrid);
      }
    };
  }, [updateGrid]);

  // Get responsive grid classes based on calculated columns
  const getGridClasses = useCallback(() => {
    const baseClasses = 'grid';
    
    // Generate responsive classes based on calculated columns
    if (columns <= 1) return `${baseClasses} grid-cols-1`;
    if (columns <= 2) return `${baseClasses} grid-cols-1 sm:grid-cols-2`;
    if (columns <= 3) return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3`;
    if (columns <= 4) return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
    if (columns <= 5) return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`;
    if (columns <= 6) return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`;
    if (columns <= 7) return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7`;
    return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8`;
  }, [columns]);

  // Get optimal card width based on available space
  const getOptimalCardWidth = useCallback(() => {
    if (containerWidth === 0) return minCardWidth;
    
    const availableWidth = containerWidth - containerPadding;
    const totalGapWidth = (columns - 1) * gap;
    const cardWidth = (availableWidth - totalGapWidth) / columns;
    
    return Math.max(minCardWidth, cardWidth);
  }, [containerWidth, columns, gap, containerPadding, minCardWidth]);

  return {
    columns,
    containerWidth,
    gridConfig,
    getGridClasses,
    getOptimalCardWidth,
    updateGrid
  };
};

export default useDynamicGrid;
