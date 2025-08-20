import React from 'react';
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface SupplierValidationProps {
  supplierId: string;
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  score: number; // 0-100
}

const SupplierValidation: React.FC<SupplierValidationProps> = ({
  supplierId,
  className = ""
}) => {
  const { suppliers } = useInventoryStore();
  
  const supplier = suppliers.find(s => s.id === supplierId);
  
  if (!supplier) {
    return null;
  }

  // Validate supplier data
  const validateSupplier = (): ValidationResult => {
    const warnings: string[] = [];
    const errors: string[] = [];
    let score = 100;

    // Required fields
    if (!supplier.name?.trim()) {
      errors.push('Supplier name is required');
      score -= 30;
    }

    // Contact information
    if (!supplier.contact_person?.trim()) {
      warnings.push('Contact person is recommended');
      score -= 10;
    }

    if (!supplier.phone?.trim()) {
      warnings.push('Phone number is recommended');
      score -= 15;
    }

    if (!supplier.email?.trim()) {
      warnings.push('Email address is recommended');
      score -= 10;
    }

    if (!supplier.address?.trim()) {
      warnings.push('Address is recommended');
      score -= 10;
    }

    // Email format validation
    if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) {
      warnings.push('Email format appears invalid');
      score -= 5;
    }

    // Phone format validation (basic)
    if (supplier.phone && supplier.phone.length < 8) {
      warnings.push('Phone number seems too short');
      score -= 5;
    }

    // Website validation
    if (supplier.website && !supplier.website.startsWith('http')) {
      warnings.push('Website should start with http:// or https://');
      score -= 5;
    }

    // Notes validation
    if (!supplier.notes?.trim()) {
      warnings.push('Notes can help with supplier management');
      score -= 5;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      score
    };
  };

  const validation = validateSupplier();

  // Don't show validation if supplier is complete
  if (validation.score >= 90 && validation.warnings.length === 0) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">Supplier information is complete</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Score indicator */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Supplier completeness</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                validation.score >= 80 ? 'bg-green-500' : 
                validation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${validation.score}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{validation.score}%</span>
        </div>
      </div>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Required fixes</span>
          </div>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                <span className="w-1 h-1 bg-red-600 rounded-full" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Recommendations</span>
          </div>
          <ul className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                <span className="w-1 h-1 bg-yellow-600 rounded-full" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SupplierValidation;
