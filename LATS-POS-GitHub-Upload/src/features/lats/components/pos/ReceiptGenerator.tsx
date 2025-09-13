// ReceiptGenerator component for LATS module
import React, { useRef } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

interface CartItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  isExternal?: boolean;
}

interface PaymentData {
  method: {
    id: string;
    name: string;
    type: string;
  };
  amount: number;
  reference?: string;
  changeAmount?: number;
}

interface DeliveryData {
  option: {
    name: string;
    cost: number;
  };
  customer: {
    name: string;
    phone: string;
    address?: string;
  };
}

interface ReceiptData {
  transactionId: string;
  date: Date;
  cashier: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  discountPercentage: number;
  total: number;
  payment: PaymentData;
  delivery?: DeliveryData;
  storeInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    website?: string;
    logo?: string;
  };
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onPrint?: () => void;
  onEmail?: () => void;
  onClose?: () => void;
  className?: string;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onPrint,
  onEmail,
  onClose,
  className = ''
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Handle email
  const handleEmail = () => {
    onEmail?.();
  };

  // Format receipt number
  const formatReceiptNumber = (transactionId: string) => {
    return `REC-${transactionId}`;
  };

  // Calculate item count
  const itemCount = receiptData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Receipt */}
      <GlassCard ref={receiptRef} className="print:shadow-none print:bg-white">
        {/* Store Header */}
        <div className="text-center mb-4 pb-4 border-b border-lats-glass-border">
          {receiptData.storeInfo.logo && (
            <img 
              src={receiptData.storeInfo.logo} 
              alt="Store Logo"
              className="h-12 mx-auto mb-2"
            />
          )}
          <h2 className="text-lg font-bold text-lats-text">
            {receiptData.storeInfo.name}
          </h2>
          <p className="text-sm text-lats-text-secondary">
            {receiptData.storeInfo.address}
          </p>
          <p className="text-sm text-lats-text-secondary">
            {receiptData.storeInfo.phone}
          </p>
          {receiptData.storeInfo.email && (
            <p className="text-sm text-lats-text-secondary">
              {receiptData.storeInfo.email}
            </p>
          )}
        </div>

        {/* Receipt Info */}
        <div className="mb-4 pb-4 border-b border-lats-glass-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Receipt:</span>
            <span className="font-mono font-bold text-lats-text">
              {formatReceiptNumber(receiptData.transactionId)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Date:</span>
            <span className="text-lats-text">
              {format.dateTime(receiptData.date)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-lats-text-secondary">Cashier:</span>
            <span className="text-lats-text">
              {receiptData.cashier}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        {receiptData.delivery && (
          <div className="mb-4 pb-4 border-b border-lats-glass-border">
            <h3 className="text-sm font-medium text-lats-text mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Name:</span>
                <span className="text-lats-text">{receiptData.delivery.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Phone:</span>
                <span className="text-lats-text">{receiptData.delivery.customer.phone}</span>
              </div>
              {receiptData.delivery.customer.address && (
                <div className="flex items-center justify-between">
                  <span className="text-lats-text-secondary">Address:</span>
                  <span className="text-lats-text text-right">{receiptData.delivery.customer.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mb-4 pb-4 border-b border-lats-glass-border">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-lats-text">Items ({itemCount})</span>
            <span className="text-lats-text-secondary">Qty × Price</span>
          </div>
          
          <div className="space-y-2">
            {receiptData.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-lats-text font-medium truncate">
                    {item.productName}
                    {item.isExternal && (
                      <GlassBadge variant="warning" size="xs" className="ml-1">
                        External
                      </GlassBadge>
                    )}
                  </div>
                  <div className="text-lats-text-secondary text-xs font-mono">
                    {item.sku}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-lats-text">
                    {item.quantity} × {format.money(item.unitPrice)}
                  </div>
                  <div className="text-lats-text font-bold">
                    {format.money(item.subtotal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mb-4 pb-4 border-b border-lats-glass-border">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Subtotal:</span>
              <span className="text-lats-text">{format.money(receiptData.subtotal)}</span>
            </div>
            
            {receiptData.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">
                  Discount ({receiptData.discountPercentage}%):
                </span>
                <span className="text-lats-success">-{format.money(receiptData.discountAmount)}</span>
              </div>
            )}
            
            {receiptData.delivery && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">
                  Delivery ({receiptData.delivery.option.name}):
                </span>
                <span className="text-lats-text">{format.money(receiptData.delivery.option.cost)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">
                Tax ({receiptData.taxRate}%):
              </span>
              <span className="text-lats-text">{format.money(receiptData.taxAmount)}</span>
            </div>
            
            <div className="flex items-center justify-between text-lg font-bold border-t border-lats-glass-border pt-2">
              <span className="text-lats-text">Total:</span>
              <span className="text-lats-text">{format.money(receiptData.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-4 pb-4 border-b border-lats-glass-border">
          <h3 className="text-sm font-medium text-lats-text mb-2">Payment Information</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Method:</span>
              <span className="text-lats-text">{receiptData.payment.method.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Amount Paid:</span>
              <span className="text-lats-text">{format.money(receiptData.payment.amount)}</span>
            </div>
            {receiptData.payment.changeAmount && receiptData.payment.changeAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Change:</span>
                <span className="text-lats-success">{format.money(receiptData.payment.changeAmount)}</span>
              </div>
            )}
            {receiptData.payment.reference && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Reference:</span>
                <span className="text-lats-text font-mono">{receiptData.payment.reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-lats-text-secondary">
          <p className="mb-2">Thank you for your purchase!</p>
          <p className="mb-2">Please keep this receipt for your records</p>
          {receiptData.storeInfo.website && (
            <p>Visit us at: {receiptData.storeInfo.website}</p>
          )}
          <div className="mt-4 text-xs">
            <p>Generated on {format.dateTime(new Date())}</p>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 print:hidden">
        <GlassButton
          variant="primary"
          onClick={handlePrint}
          className="flex-1"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          }
        >
          Print Receipt
        </GlassButton>
        
        <GlassButton
          variant="secondary"
          onClick={handleEmail}
          className="flex-1"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        >
          Email Receipt
        </GlassButton>
        
        {onClose && (
          <GlassButton
            variant="ghost"
            onClick={onClose}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Close
          </GlassButton>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
};

// Export with display name for debugging
ReceiptGenerator.displayName = 'ReceiptGenerator';

export default ReceiptGenerator;
