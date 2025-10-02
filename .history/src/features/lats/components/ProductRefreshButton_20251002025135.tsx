import React, { useState } from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { toast } from 'react-hot-toast';

interface ProductRefreshButtonProps {
  className?: string;
  showText?: boolean;
}

const ProductRefreshButton: React.FC<ProductRefreshButtonProps> = ({ 
  className = '', 
  showText = true 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { forceRefreshProducts, products } = useInventoryStore();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Manual product refresh triggered');
      await forceRefreshProducts();
      
      toast.success(`✅ Products refreshed! Now showing ${products.length} products`, {
        duration: 3000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('❌ Error refreshing products:', error);
      toast.error('Failed to refresh products. Please try again.', {
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
        bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400
        transition-colors duration-200
        ${className}
      `}
      title="Refresh products from database"
    >
      <RefreshCw 
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      {showText && (
        <span>
          {isRefreshing ? 'Refreshing...' : 'Refresh Products'}
        </span>
      )}
    </button>
  );
};

export default ProductRefreshButton;
