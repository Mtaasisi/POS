import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicProductTextProps {
  children: React.ReactNode;
  delay?: number;
  isVisible?: boolean;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

const DynamicProductText: React.FC<DynamicProductTextProps> = ({
  children,
  delay = 100,
  isVisible = true,
  priority = false,
  className = '',
  fallback
}) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [isRendered, setIsRendered] = useState(priority);
  const textRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '20px',
        threshold: 0.1
      }
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isLoaded]);

  // Progressive rendering
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      setIsRendered(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoaded, delay]);

  // Default fallback
  const defaultFallback = (
    <div className="flex items-center gap-2 text-gray-400">
      <Loader2 size={14} className="animate-spin" />
      <span className="text-sm">Loading...</span>
    </div>
  );

  return (
    <div 
      ref={textRef}
      className={`transition-all duration-300 ${
        isRendered ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {isRendered ? (
        children
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};

// Specialized text components for different product text types
export const DynamicProductName: React.FC<{
  name: string;
  priority?: boolean;
  className?: string;
}> = ({ name, priority = false, className = '' }) => (
  <DynamicProductText
    priority={priority}
    delay={50}
    className={className}
    fallback={
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
    }
  >
    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
      {name}
    </h3>
  </DynamicProductText>
);

export const DynamicProductSKU: React.FC<{
  sku: string;
  priority?: boolean;
  className?: string;
}> = ({ sku, priority = false, className = '' }) => (
  <DynamicProductText
    priority={priority}
    delay={100}
    className={className}
    fallback={
      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
    }
  >
    <p className="text-xs text-gray-500 mb-2">SKU: {sku}</p>
  </DynamicProductText>
);

export const DynamicProductPrice: React.FC<{
  price: number;
  priority?: boolean;
  className?: string;
  currency?: string;
}> = ({ price, priority = false, className = '', currency = 'TSH' }) => (
  <DynamicProductText
    priority={priority}
    delay={150}
    className={className}
    fallback={
      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
    }
  >
    <span className="font-bold text-green-600">
      {price.toLocaleString()} {currency}
    </span>
  </DynamicProductText>
);

export const DynamicProductDescription: React.FC<{
  description: string;
  priority?: boolean;
  className?: string;
  maxLines?: number;
}> = ({ description, priority = false, className = '', maxLines = 2 }) => (
  <DynamicProductText
    priority={priority}
    delay={200}
    className={className}
    fallback={
      <div className="space-y-1">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
      </div>
    }
  >
    <p 
      className={`text-sm text-gray-600 ${maxLines > 1 ? `line-clamp-${maxLines}` : 'truncate'}`}
    >
      {description}
    </p>
  </DynamicProductText>
);

export const DynamicProductCategory: React.FC<{
  category: string;
  priority?: boolean;
  className?: string;
}> = ({ category, priority = false, className = '' }) => (
  <DynamicProductText
    priority={priority}
    delay={250}
    className={className}
    fallback={
      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
    }
  >
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
      {category}
    </span>
  </DynamicProductText>
);

export default DynamicProductText;
