import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface PurchaseOrderHistoryItem {
  id: string;
  orderNumber: string;
  orderDate: string;
  quantity: number;
  costPrice: number;
  receivedQuantity: number;
  status: string;
  supplierName?: string;
  currency?: string;
  poStatus: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'shipped' | 'partial_received' | 'received' | 'completed' | 'cancelled';
}

export interface PurchaseOrderStats {
  totalOrders: number;
  totalQuantityOrdered: number;
  totalQuantityReceived: number;
  averageCostPrice: number;
  lastOrderDate: string | null;
  lastCostPrice: number | null;
  lowestCostPrice: number | null;
  highestCostPrice: number | null;
}

export const usePurchaseOrderHistory = (productId: string | undefined) => {
  const [history, setHistory] = useState<PurchaseOrderHistoryItem[]>([]);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setHistory([]);
      setStats(null);
      return;
    }

    const fetchPurchaseOrderHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('📦 Fetching purchase order history for product:', productId);

        // Fetch purchase order items for this product with a simpler approach
        const { data: items, error: itemsError } = await supabase
          .from('lats_purchase_order_items')
          .select(`
            id,
            purchase_order_id,
            product_id,
            variant_id,
            quantity,
            cost_price,
            received_quantity,
            created_at
          `)
          .eq('product_id' as any, productId as any)
          .order('created_at', { ascending: false })
          .limit(20);

        if (itemsError) {
          console.error('❌ Error fetching purchase order history:', itemsError);
          throw itemsError;
        }

        console.log('✅ Purchase order items fetched:', items);

        if (!items || items.length === 0) {
          setHistory([]);
          setStats(null);
          return;
        }

        // Get unique purchase order IDs
        const purchaseOrderIds = [...new Set(items.map((item: any) => item.purchase_order_id).filter(Boolean))];

        // Fetch purchase order details one by one to avoid query issues
        let purchaseOrders: any[] = [];
        if (purchaseOrderIds.length > 0) {
          try {
            // Fetch all purchase orders in parallel
            const poPromises = purchaseOrderIds.map(async (id) => {
              const { data, error } = await supabase
                .from('lats_purchase_orders')
                .select('id, order_number, created_at, status, currency, supplier_id')
                .eq('id', id)
                .single();
              
              if (error) {
                console.warn(`⚠️ Error fetching purchase order ${id}:`, error);
                return null;
              }
              return data;
            });
            
            const results = await Promise.all(poPromises);
            purchaseOrders = results.filter(Boolean);
          } catch (error) {
            console.error('❌ Error fetching purchase orders:', error);
            throw error;
          }
        }

        // Create a map of purchase order data
        const poMap = new Map();
        (purchaseOrders || []).forEach((po: any) => {
          poMap.set(po.id, po);
        });

        // Fetch supplier names
        const supplierIds = [...new Set((purchaseOrders || [])
          .map((po: any) => po.supplier_id)
          .filter(Boolean)
        )];

        let supplierMap = new Map<string, string>();
        if (supplierIds.length > 0) {
          try {
            // Fetch suppliers one by one to avoid query issues
            const supplierPromises = supplierIds.map(async (id) => {
              const { data, error } = await supabase
                .from('lats_suppliers')
                .select('id, name')
                .eq('id', id)
                .single();
              
              if (error) {
                console.warn(`⚠️ Error fetching supplier ${id}:`, error);
                return null;
              }
              return data;
            });
            
            const supplierResults = await Promise.all(supplierPromises);
            const suppliers = supplierResults.filter(Boolean);
            supplierMap = new Map(suppliers.map((s: any) => [s.id, s.name]));
          } catch (error) {
            console.warn('⚠️ Error fetching suppliers:', error);
            // Continue without suppliers rather than failing completely
          }
        }

        // Transform data
        const historyItems: PurchaseOrderHistoryItem[] = items.map((item: any) => {
          const po = poMap.get(item.purchase_order_id);
          return {
            id: item.id,
            orderNumber: po?.order_number || 'N/A',
            orderDate: po?.order_date || item.created_at,
            quantity: item.quantity || 0,
            costPrice: item.cost_price || 0,
            receivedQuantity: item.received_quantity || 0,
            status: po?.status || 'unknown',
            supplierName: supplierMap.get(po?.supplier_id) || 'Unknown',
            currency: po?.currency || 'TZS',
            poStatus: po?.status || 'draft'
          };
        });

        setHistory(historyItems);

        // Calculate statistics
        if (historyItems.length > 0) {
          const totalOrders = historyItems.length;
          const totalQuantityOrdered = historyItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalQuantityReceived = historyItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
          const averageCostPrice = historyItems.reduce((sum, item) => sum + item.costPrice, 0) / totalOrders;
          const lastOrderDate = historyItems[0]?.orderDate || null;
          const lastCostPrice = historyItems[0]?.costPrice || null;
          const costPrices = historyItems.map(item => item.costPrice).filter(price => price > 0);
          const lowestCostPrice = costPrices.length > 0 ? Math.min(...costPrices) : null;
          const highestCostPrice = costPrices.length > 0 ? Math.max(...costPrices) : null;

          setStats({
            totalOrders,
            totalQuantityOrdered,
            totalQuantityReceived,
            averageCostPrice,
            lastOrderDate,
            lastCostPrice,
            lowestCostPrice,
            highestCostPrice
          });
        } else {
          setStats(null);
        }

      } catch (err: any) {
        console.error('❌ Error in usePurchaseOrderHistory:', err);
        setError(err.message || 'Failed to fetch purchase order history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrderHistory();
  }, [productId]);

  return { history, stats, isLoading, error };
};

