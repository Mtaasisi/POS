// PurchaseOrderSummaryModal component - Final review before creating purchase order
import React from 'react';
import {
  FileText, Truck, Calendar, DollarSign, Globe, Package,
  CheckCircle, XCircle, RefreshCw, AlertCircle, User, Phone,
  Mail, MapPin, Clock, CreditCard, Scale, Target, Send
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface PurchaseCartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  sku: string;
  costPrice: number;
  quantity: number;
  totalPrice: number;
  category?: string;
  brand?: string;
}

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface PurchaseOrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: PurchaseCartItem[];
  supplier: Supplier | null;
  currency: Currency;
  subtotal: number;
  tax: number;
  totalAmount: number;
  expectedDelivery: string;
  paymentTerms: string;
  notes: string;
  onCreatePO: () => void;
  isCreating: boolean;
}

const PurchaseOrderSummaryModal: React.FC<PurchaseOrderSummaryModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  supplier,
  currency,
  subtotal,
  tax,
  totalAmount,
  expectedDelivery,
  paymentTerms,
  notes,
  onCreatePO,
  isCreating
}) => {
  const formatMoney = (amount: number) => {
    if (currency.code === 'TZS') {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount).replace(/\.00$/, '').replace(/\.0$/, '');
    }
    
    return `${currency.symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentTermsDisplay = (terms: string) => {
    const paymentTermsMap: { [key: string]: string } = {
      'net_15': 'Net 15 days',
      'net_30': 'Net 30 days',
      'net_45': 'Net 45 days',
      'net_60': 'Net 60 days',
      'advance': 'Advance Payment',
      'cod': 'Cash on Delivery',
      '2_10_net_30': '2/10 Net 30'
    };
    return paymentTermsMap[terms] || terms;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Purchase Order Summary</h2>
                <p className="text-gray-600">Review details before creating purchase order</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isCreating}
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Supplier & Order Details */}
            <div className="space-y-6">
              {/* Supplier Information */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  Supplier Information
                </h3>
                {supplier ? (
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{supplier.name}</div>
                      {supplier.company_name && supplier.company_name !== supplier.name && (
                        <div className="text-sm text-gray-600">{supplier.company_name}</div>
                      )}
                    </div>
                    
                    {supplier.contactPerson && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{supplier.contactPerson}</span>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    
                    {(supplier.city || supplier.country) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{[supplier.city, supplier.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600">No supplier selected</div>
                )}
              </div>

              {/* Order Details */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Order Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium">{currency.flag} {currency.code}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span className="font-medium">{getPaymentTermsDisplay(paymentTerms)}</span>
                  </div>
                  
                  {expectedDelivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Expected Delivery:</span>
                      <span className="font-medium">{formatDate(expectedDelivery)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Items Count:</span>
                    <span className="font-medium">{cartItems.length} products</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} units</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Notes
                  </h3>
                  <p className="text-gray-700 text-sm">{notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Items & Financial Summary */}
            <div className="space-y-6">
              {/* Items List */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  Items ({cartItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{item.name}</div>
                          {item.variantName && item.variantName !== 'Default' && (
                            <div className="text-sm text-gray-600">{item.variantName}</div>
                          )}
                          <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                          {item.category && (
                            <div className="text-xs text-gray-500">Category: {item.category}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium text-gray-900">
                            {item.quantity} × {formatMoney(item.costPrice)}
                          </div>
                          <div className="font-semibold text-orange-600">
                            {formatMoney(item.totalPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatMoney(subtotal)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tax (18%):</span>
                    <span className="font-medium text-gray-900">{formatMoney(tax)}</span>
                  </div>
                  
                  <div className="border-t border-green-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatMoney(totalAmount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Amount will be charged in {currency.code}
                  </div>
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                  Pre-creation Checklist
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {supplier ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={supplier ? 'text-green-700' : 'text-red-700'}>
                      Supplier selected
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {cartItems.length > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={cartItems.length > 0 ? 'text-green-700' : 'text-red-700'}>
                      Items added to cart
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {expectedDelivery ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={expectedDelivery ? 'text-green-700' : 'text-red-700'}>
                      Expected delivery date set
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {paymentTerms ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={paymentTerms ? 'text-green-700' : 'text-red-700'}>
                      Payment terms configured
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {supplier && cartItems.length > 0 && expectedDelivery && paymentTerms
                ? 'Ready to create purchase order'
                : 'Please complete all required fields'
              }
            </div>
            <div className="flex gap-3">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                disabled={isCreating}
              >
                Back to Edit
              </GlassButton>
              <GlassButton
                onClick={onCreatePO}
                disabled={!supplier || cartItems.length === 0 || !expectedDelivery || !paymentTerms || isCreating}
                icon={isCreating ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white"
              >
                {isCreating ? 'Creating Purchase Order...' : 'Create Purchase Order'}
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default PurchaseOrderSummaryModal;