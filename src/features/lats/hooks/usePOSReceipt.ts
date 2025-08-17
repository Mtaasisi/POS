import { useState, useCallback, useMemo } from 'react';

interface ReceiptItem {
  id: string;
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  paymentMethod: string;
  cashierName: string;
  transactionId?: string;
}

interface ReceiptTemplate {
  header: string;
  footer: string;
  showLogo: boolean;
  showTax: boolean;
  showCustomerInfo: boolean;
  fontSize: 'small' | 'medium' | 'large';
  paperSize: 'thermal' | 'a4' | 'email';
}

export const usePOSReceipt = () => {
  const [receiptHistory, setReceiptHistory] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptHistory, setShowReceiptHistory] = useState(false);
  const [receiptPrintMode, setReceiptPrintMode] = useState<'thermal' | 'a4' | 'email'>('thermal');
  
  const [receiptTemplate, setReceiptTemplate] = useState<ReceiptTemplate>({
    header: 'LATS CHANCE STORE',
    footer: 'Thank you for your purchase!',
    showLogo: true,
    showTax: true,
    showCustomerInfo: true,
    fontSize: 'medium',
    paperSize: 'thermal'
  });

  // Generate receipt number
  const generateReceiptNumber = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
  }, []);

  // Create receipt from cart data
  const createReceipt = useCallback((
    items: ReceiptItem[],
    totals: { subtotal: number; tax: number; discount: number; total: number },
    customer?: { name: string; phone?: string; email?: string },
    paymentMethod: string,
    cashierName: string,
    transactionId?: string
  ): Receipt => {
    const receipt: Receipt = {
      id: `receipt-${Date.now()}`,
      receiptNumber: generateReceiptNumber(),
      date: new Date(),
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      customer,
      paymentMethod,
      cashierName,
      transactionId
    };

    // Add to history
    setReceiptHistory(prev => [receipt, ...prev.slice(0, 99)]); // Keep last 100 receipts

    return receipt;
  }, [generateReceiptNumber]);

  // Generate receipt content for printing
  const generateReceiptContent = useCallback((receipt: Receipt): string => {
    const formatMoney = (amount: number) => {
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let content = '';

    // Header
    content += `${receiptTemplate.header}\n`;
    content += '='.repeat(receiptTemplate.header.length) + '\n\n';

    // Receipt info
    content += `Receipt: ${receipt.receiptNumber}\n`;
    content += `Date: ${formatDate(receipt.date)}\n`;
    content += `Cashier: ${receipt.cashierName}\n`;
    if (receipt.transactionId) {
      content += `TXN: ${receipt.transactionId}\n`;
    }
    content += '\n';

    // Customer info
    if (receipt.customer && receiptTemplate.showCustomerInfo) {
      content += `Customer: ${receipt.customer.name}\n`;
      if (receipt.customer.phone) {
        content += `Phone: ${receipt.customer.phone}\n`;
      }
      if (receipt.customer.email) {
        content += `Email: ${receipt.customer.email}\n`;
      }
      content += '\n';
    }

    // Items
    content += 'ITEMS:\n';
    content += '-'.repeat(40) + '\n';
    
    receipt.items.forEach(item => {
      const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
      content += `${item.quantity}x ${itemName}\n`;
      content += `  ${formatMoney(item.unitPrice)} TZS each\n`;
      content += `  ${formatMoney(item.totalPrice)} TZS\n\n`;
    });

    // Totals
    content += '-'.repeat(40) + '\n';
    content += `Subtotal: ${formatMoney(receipt.subtotal)} TZS\n`;
    
    if (receiptTemplate.showTax && receipt.tax > 0) {
      content += `Tax (18%): ${formatMoney(receipt.tax)} TZS\n`;
    }
    
    if (receipt.discount > 0) {
      content += `Discount: -${formatMoney(receipt.discount)} TZS\n`;
    }
    
    content += `TOTAL: ${formatMoney(receipt.total)} TZS\n`;
    content += '\n';

    // Payment method
    content += `Payment: ${receipt.paymentMethod}\n\n`;

    // Footer
    content += receiptTemplate.footer + '\n';

    return content;
  }, [receiptTemplate]);

  // Print receipt
  const printReceipt = useCallback(async (receipt: Receipt) => {
    const content = generateReceiptContent(receipt);
    
    switch (receiptPrintMode) {
      case 'thermal':
        // Simulate thermal printer
        console.log('Printing to thermal printer:', content);
        break;
      
      case 'a4':
        // Generate PDF for A4 printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt ${receipt.receiptNumber}</title>
                <style>
                  body { font-family: monospace; font-size: 12px; line-height: 1.4; }
                  .receipt { max-width: 80mm; margin: 0 auto; }
                </style>
              </head>
              <body>
                <div class="receipt">
                  <pre>${content}</pre>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
      
      case 'email':
        // Generate email content
        const emailSubject = `Receipt ${receipt.receiptNumber} - LATS CHANCE STORE`;
        const emailBody = `Please find your receipt attached.\n\n${content}`;
        
        const mailtoLink = `mailto:${receipt.customer?.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink);
        break;
    }
  }, [generateReceiptContent, receiptPrintMode]);

  // Export receipt as PDF
  const exportReceiptPDF = useCallback(async (receipt: Receipt) => {
    // This would integrate with a PDF library like jsPDF
    console.log('Exporting receipt as PDF:', receipt.receiptNumber);
    
    // For now, just simulate PDF generation
    const content = generateReceiptContent(receipt);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [generateReceiptContent]);

  // Search receipts
  const searchReceipts = useCallback((query: string) => {
    if (!query.trim()) return receiptHistory;
    
    const searchTerm = query.toLowerCase();
    return receiptHistory.filter(receipt => 
      receipt.receiptNumber.toLowerCase().includes(searchTerm) ||
      receipt.customer?.name.toLowerCase().includes(searchTerm) ||
      receipt.customer?.phone?.includes(searchTerm) ||
      receipt.paymentMethod.toLowerCase().includes(searchTerm)
    );
  }, [receiptHistory]);

  // Get receipt statistics
  const getReceiptStats = useMemo(() => {
    const totalReceipts = receiptHistory.length;
    const totalSales = receiptHistory.reduce((sum, receipt) => sum + receipt.total, 0);
    const averageSale = totalReceipts > 0 ? totalSales / totalReceipts : 0;
    
    const today = new Date().toDateString();
    const todayReceipts = receiptHistory.filter(receipt => 
      receipt.date.toDateString() === today
    );
    const todaySales = todayReceipts.reduce((sum, receipt) => sum + receipt.total, 0);

    return {
      totalReceipts,
      totalSales,
      averageSale,
      todayReceipts: todayReceipts.length,
      todaySales
    };
  }, [receiptHistory]);

  return {
    // State
    receiptHistory,
    selectedReceipt,
    showReceiptHistory,
    receiptPrintMode,
    receiptTemplate,
    
    // Actions
    setSelectedReceipt,
    setShowReceiptHistory,
    setReceiptPrintMode,
    setReceiptTemplate,
    createReceipt,
    printReceipt,
    exportReceiptPDF,
    searchReceipts,
    
    // Computed
    getReceiptStats
  };
};
