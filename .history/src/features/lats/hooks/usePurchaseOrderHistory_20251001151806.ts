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

        // Fetch purchase order items for this product
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
            created_at,
            lats_purchase_orders!inner (
              id,
              order_number,
              order_date,
              status,
              currency,
              lats_suppliers (
                id,
                name
              )
            )
          `)
          .filter('product_id', 'eq', productId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (itemsError) {
          console.error('❌ Error fetching purchase order history:', itemsError);
          throw itemsError;
        }

        console.log('✅ Purchase order history fetched:', items);

        // Transform data
        const historyItems: PurchaseOrderHistoryItem[] = (items || []).map((item: any) => ({
          id: item.id,
          orderNumber: item.lats_purchase_orders?.order_number || 'N/A',
          orderDate: item.lats_purchase_orders?.order_date || item.created_at,
          quantity: item.quantity || 0,
          costPrice: item.cost_price || 0,
          receivedQuantity: item.received_quantity || 0,
          status: item.lats_purchase_orders?.status || 'unknown',
          supplierName: item.lats_purchase_orders?.lats_suppliers?.name || 'Unknown',
          currency: item.lats_purchase_orders?.currency || 'TZS',
          poStatus: item.lats_purchase_orders?.status || 'draft'
        }));

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

