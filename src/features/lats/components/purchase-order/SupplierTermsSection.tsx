// SupplierTermsSection component - For managing supplier terms and conditions
import React from 'react';
import { CreditCard, FileText, AlertCircle, Info, Calendar, DollarSign } from 'lucide-react';

interface SupplierTermsSectionProps {
  paymentTerms: string;
  onPaymentTermsChange: (terms: string) => void;
  supplierTerms?: string;
  className?: string;
}

const PAYMENT_TERMS = [
  { id: 'net_15', name: 'Net 15', description: 'Payment due in 15 days' },
  { id: 'net_30', name: 'Net 30', description: 'Payment due in 30 days' },
  { id: 'net_45', name: 'Net 45', description: 'Payment due in 45 days' },
  { id: 'net_60', name: 'Net 60', description: 'Payment due in 60 days' },
  { id: 'advance', name: 'Advance Payment', description: 'Payment before delivery' },
  { id: 'cod', name: 'Cash on Delivery', description: 'Payment on delivery' },
  { id: '2_10_net_30', name: '2/10 Net 30', description: '2% discount if paid within 10 days, net 30' }
];

const SupplierTermsSection: React.FC<SupplierTermsSectionProps> = ({
  paymentTerms,
  onPaymentTermsChange,
  supplierTerms,
  className = ''
}) => {
  const selectedTerm = PAYMENT_TERMS.find(term => term.id === paymentTerms);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Terms
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={paymentTerms}
            onChange={(e) => onPaymentTermsChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
          >
            <option value="">Select payment terms</option>
            {PAYMENT_TERMS.map(term => (
              <option key={term.id} value={term.id}>
                {term.name} - {term.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTerm && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <Info className="w-4 h-4" />
            <span className="font-medium">{selectedTerm.name}:</span>
            <span>{selectedTerm.description}</span>
          </div>
        </div>
      )}

      {supplierTerms && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Supplier Terms & Conditions</span>
          </div>
          <p className="text-sm text-gray-600">{supplierTerms}</p>
        </div>
      )}

      {paymentTerms && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              Ensure your organization can meet the selected payment terms before proceeding.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierTermsSection;