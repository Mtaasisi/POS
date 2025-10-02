import React from 'react';
import StockValueCalculator from '../components/StockValueCalculator';

const StockValuePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <StockValueCalculator />
    </div>
  );
};

export default StockValuePage;
