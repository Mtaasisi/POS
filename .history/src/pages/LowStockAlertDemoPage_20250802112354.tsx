import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
import LowStockAlertCard from '../components/LowStockAlertCard';
import EnhancedLowStockAlertCard from '../components/EnhancedLowStockAlertCard';
import { SparePart } from '../lib/database.types';

const LowStockAlertDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<'basic' | 'enhanced'>('enhanced');

  // Sample data for demonstration
  const sampleLowStockParts: SparePart[] = [
    {
      id: '1',
      name: 'Galaxy S24 Motherboard',
      brand: 'Samsung',
      category: 'motherboard',
      stock_quantity: 4,
      min_stock_level: 5,
      cost: 89.99,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'iPhone 15 Logic Board',
      brand: 'Apple',
      category: 'motherboard',
      stock_quantity: 0,
      min_stock_level: 5,
      cost: 129.99,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Smartphone Display',
      brand: 'Generic',
      category: 'display',
      stock_quantity: 32,
      min_stock_level: 532,
      cost: 45.50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Package Components',
      brand: 'Generic',
      category: 'charger',
      stock_quantity: 324,
      min_stock_level: 532,
      cost: 12.99,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Battery Pack',
      brand: 'Samsung',
      category: 'battery',
      stock_quantity: 2,
      min_stock_level: 10,
      cost: 25.99,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      name: 'Camera Module',
      brand: 'Apple',
      category: 'camera',
      stock_quantity: 1,
      min_stock_level: 8,
      cost: 67.50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const handleRestockNow = () => {
    console.log('Restock Now clicked');
    // Navigate to inventory management or show restock modal
  };

  const handleViewAll = () => {
    console.log('View All clicked');
    navigate('/spare-parts');
  };

  const handleDismiss = () => {
    console.log('Alert dismissed');
  };

  const handlePartClick = (part: SparePart) => {
    console.log('Part clicked:', part);
    // Navigate to part details or show edit modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Low Stock Alert Redesign</h1>
            <p className="text-gray-600">Enhanced UI for spare parts management alerts</p>
          </div>
        </div>

        {/* Card Type Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-lg">
            <span className="text-sm font-medium text-gray-700">Select Card Type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCard('basic')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCard === 'basic'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Basic Card
              </button>
              <button
                onClick={() => setSelectedCard('enhanced')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCard === 'enhanced'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Enhanced Card
              </button>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="space-y-8">
          {selectedCard === 'basic' ? (
            <LowStockAlertCard
              lowStockParts={sampleLowStockParts}
              onRestockNow={handleRestockNow}
              onViewAll={handleViewAll}
              onDismiss={handleDismiss}
              onPartClick={handlePartClick}
            />
          ) : (
            <EnhancedLowStockAlertCard
              lowStockParts={sampleLowStockParts}
              onRestockNow={handleRestockNow}
              onViewAll={handleViewAll}
              onDismiss={handleDismiss}
              onPartClick={handlePartClick}
            />
          )}
        </div>

        {/* Features Comparison */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Card Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Simple alert design with gradient background
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Basic stock level indicators
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Standard action buttons
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Responsive grid layout
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Enhanced Card Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Priority-based sorting (Critical → Urgent → Warning → Low)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Color-coded urgency levels with badges
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Priority summary with critical/urgent counts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Show more/less functionality for large lists
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Enhanced visual hierarchy and animations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Cost display and percentage indicators
              </li>
            </ul>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Implementation Guide</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>1. Import the component:</strong>
            </p>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`import EnhancedLowStockAlertCard from '../components/EnhancedLowStockAlertCard';`}
            </pre>
            
            <p>
              <strong>2. Use in your component:</strong>
            </p>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`<EnhancedLowStockAlertCard
  lowStockParts={lowStockParts}
  onRestockNow={() => handleRestock()}
  onViewAll={() => navigate('/spare-parts')}
  onDismiss={() => setShowAlert(false)}
  onPartClick={(part) => handlePartClick(part)}
/>`}
            </pre>
            
            <p>
              <strong>3. Replace the existing low stock alert in SparePartsPage.tsx</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlertDemoPage; 