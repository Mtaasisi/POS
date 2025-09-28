import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableCategoriesProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandableCategories: React.FC<ExpandableCategoriesProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="relative">
      {/* Category Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
      >
        <span className="whitespace-nowrap">
          {selectedCategory === '' ? 'All Categories' : selectedCategory}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded Categories Dropdown */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* All Categories Option */}
          <button
            onClick={() => {
              onCategorySelect('');
              onToggle();
            }}
            className={`w-full px-3 py-2 text-sm text-left transition-colors ${
              selectedCategory === '' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          
          {/* Category Options */}
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                onCategorySelect(category);
                onToggle();
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                selectedCategory === category 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpandableCategories;