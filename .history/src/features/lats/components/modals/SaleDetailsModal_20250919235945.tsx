import React, { useState, useEffect } from 'react';
import { X, FileText, User, CreditCard, Package, Calendar, Clock, MapPin, Phone, Mail, DollarSign, TrendingUp, ShoppingCart, Receipt, Download, Printer } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
}

interface SaleData {
  id: string;
  sale_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  total_amount: number;
  discount: number;
  discount_type: string;
  discount_value: number;
  tax: number;
  payment_method: any;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  metadata?: any;
  customers?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
    created_at: string;
    updated_at: string;
  };
  lats_sale_items?: SaleItem[];
}

interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  variant_id: string;
  product_name?: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price?: number;
  profit?: number;
  notes?: string;
  lats_products?: {
    id: string;
    name: string;
    description?: string;
    category_id?: string;
    sku?: string;
    barcode?: string;
    is_active?: boolean;
    created_at: string;
    updated_at: string;
    lats_categories?: {
      id: string;
      name: string;
      description?: string;
      parent_id?: string;
      created_at: string;
    };
  };
  lats_product_variants?: {
    id: string;
    product_id: string;
    name: string;
    sku?: string;
    attributes?: any;
    price: number;
    cost_price?: number;
    quantity?: number;
    is_active?: boolean;
    created_at: string;
    updated_at: string;
    lats_products?: {
      id: string;
      name: string;
      description?: string;
      sku?: string;
      barcode?: string;
    };
  };
}

const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({ isOpen, onClose, saleId }) => {
  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && saleId) {
      // Validate sale ID format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(saleId)) {
        console.error('❌ Invalid sale ID format:', saleId);
        setError('Invalid sale ID format');
        return;
      }
      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching sale details for ID:', saleId);

      // First, try to get the sale without joins to see if it exists
      const { data: saleExists, error: existsError } = await supabase
        .from('lats_sales')
        .select('id, sale_number, created_at')
        .eq('id', saleId)
        .single();

      if (existsError) {
        console.error('❌ Sale does not exist or access denied:', existsError);
        setError(`Sale not found or access denied. Error: ${existsError.message}`);
        return;
      }

      console.log('✅ Sale exists:', saleExists);

      // Now fetch with full details including all related data
      const { data: saleData, error: saleError } = await supabase
        .from('lats_sales')
        .select(`
          *,
          customers(
            id,
            name,
            phone,
            email,
            city,
            whatsapp,
            gender,
            loyalty_level,
            color_tag,
            total_spent,
            points,
            last_visit,
            is_active,
            notes,
            created_at,
            updated_at
          ),
          lats_sale_items(
            *,
            lats_products(
              *,
              lats_categories(
                id,
                name,
                description,
                parent_id,
                created_at
              )
            ),
            lats_product_variants(
              *,
              lats_products(
                id,
                name,
                description,
                sku,
                barcode
              )
            )
          )
        `)
        .eq('id', saleId)
        .single();

      if (saleError) {
        console.error('❌ Error fetching sale details:', saleError);
        setError(`Failed to load sale details: ${saleError.message}`);
        return;
      }

      console.log('✅ Sale data loaded successfully:', saleData);
      setSale(saleData);
    } catch (err) {
      console.error('❌ Unexpected error fetching sale details:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = (paymentMethod: any) => {
    if (!paymentMethod) return 'Unknown';
    
    if (typeof paymentMethod === 'string') {
      try {
        const parsed = JSON.parse(paymentMethod);
        if (parsed.type === 'multiple' && parsed.details?.payments) {
          const methods = parsed.details.payments.map((payment: any) => {
            const methodName = payment.method || payment.paymentMethod || 'Unknown';
            return methodName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          });
          const uniqueMethods = [...new Set(methods)];
          return uniqueMethods.join(', ');
        }
        return parsed.method || parsed.type || 'Unknown';
      } catch {
        return paymentMethod;
      }
    }
    
    if (typeof paymentMethod === 'object') {
      if (paymentMethod.type === 'multiple' && paymentMethod.details?.payments) {
        const methods = paymentMethod.details.payments.map((payment: any) => {
          const methodName = payment.method || payment.paymentMethod || 'Unknown';
          return methodName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        });
        const uniqueMethods = [...new Set(methods)];
        return uniqueMethods.join(', ');
      }
      return paymentMethod.method || paymentMethod.type || 'Unknown';
    }
    
    return 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success('Download functionality will be implemented');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sale Details</h2>
              <p className="text-sm text-gray-600">
                {sale ? `Sale #${sale.sale_number}` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading sale details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchSaleDetails}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : sale ? (
            <div className="p-6 space-y-6">
              {/* Sale Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sale Information */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Sale Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Sale Number</label>
                        <p className="text-gray-900 font-mono">{sale.sale_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Cashier</label>
                        <p className="text-gray-900">{sale.created_by ? `User: ${sale.created_by.slice(0, 8)}...` : 'System'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date & Time</label>
                        <p className="text-gray-900">{formatDate(sale.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">
                          {sale.customers?.name || (sale.customer_id ? `Customer: ${sale.customer_id.slice(0, 8)}...` : 'Walk-in Customer')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          {sale.customers?.phone || sale.customer_phone ? (
                            <>
                              <Phone className="w-4 h-4" />
                              {sale.customers?.phone || sale.customer_phone}
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          {sale.customers?.email || sale.customer_email ? (
                            <>
                              <Mail className="w-4 h-4" />
                              {sale.customers?.email || sale.customer_email}
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          {sale.customers?.address || sale.customer_address ? (
                            <>
                              <MapPin className="w-4 h-4" />
                              {sale.customers?.address || sale.customer_address}
                              {sale.customers?.city && `, ${sale.customers.city}`}
                              {sale.customers?.country && `, ${sale.customers.country}`}
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment & Summary */}
                <div className="space-y-4">
                  {/* Payment Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Method</label>
                        <p className="text-gray-900">{getPaymentMethodDisplay(sale.payment_method)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Amount</label>
                        <p className="text-2xl font-bold text-green-600">{formatMoney(sale.total_amount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Financial Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">{formatMoney(sale.total_amount + sale.discount - sale.tax)}</span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount ({sale.discount_type}):</span>
                          <span>-{formatMoney(sale.discount)}</span>
                        </div>
                      )}
                      {sale.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax:</span>
                          <span className="text-gray-900">{formatMoney(sale.tax)}</span>
                        </div>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-green-600">{formatMoney(sale.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale Items */}
              {sale.lats_sale_items && sale.lats_sale_items.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                    Sale Items ({sale.lats_sale_items.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Qty</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Unit Price</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                          {sale.lats_sale_items.some(item => item.cost_price) && (
                            <th className="text-right py-3 px-4 font-medium text-gray-600">Profit</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {sale.lats_sale_items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.lats_products?.name || item.product_name || `Product: ${item.product_id.slice(0, 8)}...`}
                                </p>
                                {item.lats_products?.description && (
                                  <p className="text-sm text-gray-500">{item.lats_products.description}</p>
                                )}
                                {item.lats_product_variants?.name && (
                                  <p className="text-sm text-gray-600">Variant: {item.lats_product_variants.name}</p>
                                )}
                                {item.lats_products?.lats_categories?.name && (
                                  <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-1">
                                    {item.lats_products.lats_categories.name}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-sm text-gray-500 italic">Note: {item.notes}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                              {item.lats_product_variants?.sku || item.lats_products?.sku || item.sku || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900">
                              {formatMoney(item.unit_price)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-900">
                              {formatMoney(item.total_price)}
                            </td>
                            {sale.lats_sale_items.some(item => item.cost_price) && (
                              <td className="py-3 px-4 text-right">
                                {item.cost_price ? (
                                  <span className={`font-medium ${(item.total_price - (item.cost_price * item.quantity)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatMoney(item.total_price - (item.cost_price * item.quantity))}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(sale.notes || sale.metadata) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Additional Information
                  </h3>
                  {sale.notes && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900 mt-1">{sale.notes}</p>
                    </div>
                  )}
                  {sale.metadata && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Metadata</label>
                      <pre className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(sale.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsModal;
