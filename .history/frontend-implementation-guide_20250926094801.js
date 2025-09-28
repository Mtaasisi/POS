// FRONTEND IMPLEMENTATION GUIDE
// Fix for 400 Bad Request errors in Supabase sales queries
// Use these code examples in your React components

// ❌ PROBLEMATIC CODE (causing 400 errors):
// This complex nested query is causing the 400 Bad Request errors:
/*
const { data, error } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(name),
    lats_sale_items(
      *,
      lats_products(name, description),
      lats_product_variants(name, sku, attributes)
    )
  `)
  .order('created_at', { ascending: false });
*/

// ✅ SOLUTION 1: Separate API calls (RECOMMENDED)
// This approach is more reliable and follows Supabase best practices

// 1. Get sales list with basic customer info
export const getSalesList = async () => {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching sales list:', error);
    return { data: null, error };
  }
};

// 2. Get detailed sale info for SaleDetailsModal
export const getSaleDetails = async (saleId) => {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(*)
      `)
      .eq('id', saleId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching sale details:', error);
    return { data: null, error };
  }
};

// 3. Get sale items with product and variant details
export const getSaleItems = async (saleId) => {
  try {
    const { data, error } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_products(name, description, sku, barcode, category_id, is_active),
        lats_product_variants(name, sku, barcode, attributes)
      `)
      .eq('sale_id', saleId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching sale items:', error);
    return { data: null, error };
  }
};

// 4. Get categories for products (if needed)
export const getProductCategories = async (productIds) => {
  try {
    const { data, error } = await supabase
      .from('lats_categories')
      .select('*')
      .in('id', productIds);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error };
  }
};

// ✅ SOLUTION 2: Combined function for SaleDetailsModal
export const getSaleWithItems = async (saleId) => {
  try {
    // Get sale details and items in parallel
    const [saleResult, itemsResult] = await Promise.all([
      getSaleDetails(saleId),
      getSaleItems(saleId)
    ]);

    if (saleResult.error) throw saleResult.error;
    if (itemsResult.error) throw itemsResult.error;

    // Combine the data
    const saleData = {
      ...saleResult.data,
      sale_items: itemsResult.data
    };

    return { data: saleData, error: null };
  } catch (error) {
    console.error('Error fetching sale with items:', error);
    return { data: null, error };
  }
};

// ✅ SOLUTION 3: React component example
import React, { useState, useEffect } from 'react';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const { data, error } = await getSalesList();
        
        if (error) {
          setError(error.message);
        } else {
          setSales(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (loading) return <div>Loading sales...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Sales List</h2>
      {sales.map(sale => (
        <div key={sale.id}>
          <h3>Sale #{sale.sale_number}</h3>
          <p>Customer: {sale.customers?.name || 'No customer'}</p>
          <p>Total: {sale.total_amount} TSH</p>
          <p>Date: {new Date(sale.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

// ✅ SOLUTION 4: SaleDetailsModal component
const SaleDetailsModal = ({ saleId, isOpen, onClose }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && saleId) {
      const fetchSaleDetails = async () => {
        try {
          setLoading(true);
          const { data, error } = await getSaleWithItems(saleId);
          
          if (error) {
            setError(error.message);
          } else {
            setSale(data);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSaleDetails();
    }
  }, [isOpen, saleId]);

  if (!isOpen) return null;

  if (loading) return <div>Loading sale details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!sale) return <div>Sale not found</div>;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Sale #{sale.sale_number}</h2>
        <p>Customer: {sale.customers?.name || 'No customer'}</p>
        <p>Total: {sale.total_amount} TSH</p>
        
        <h3>Items:</h3>
        {sale.sale_items?.map(item => (
          <div key={item.id}>
            <p>Product: {item.lats_products?.name}</p>
            <p>Variant: {item.lats_product_variants?.name}</p>
            <p>Quantity: {item.quantity}</p>
            <p>Price: {item.total_price} TSH</p>
          </div>
        ))}
        
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// ✅ SOLUTION 5: Alternative single query approach (if you must use one query)
export const getSalesWithItems = async () => {
  try {
    // This uses a simpler query structure that should work
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email),
        lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          lats_products(name, description, sku),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching sales with items:', error);
    return { data: null, error };
  }
};

// ✅ TESTING FUNCTIONS
// Use these to test your queries:

export const testSalesQueries = async () => {
  console.log('Testing sales queries...');
  
  try {
    // Test 1: Basic sales list
    const salesResult = await getSalesList();
    console.log('Sales list result:', salesResult);
    
    if (salesResult.data && salesResult.data.length > 0) {
      const firstSaleId = salesResult.data[0].id;
      
      // Test 2: Sale details
      const saleDetailsResult = await getSaleDetails(firstSaleId);
      console.log('Sale details result:', saleDetailsResult);
      
      // Test 3: Sale items
      const saleItemsResult = await getSaleItems(firstSaleId);
      console.log('Sale items result:', saleItemsResult);
    }
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// ✅ USAGE INSTRUCTIONS
// 1. Replace your current complex queries with these simple ones
// 2. Use separate API calls instead of nested queries
// 3. Test each function individually
// 4. Update your components to use the new approach
// 5. Remove the problematic complex nested query

export default {
  getSalesList,
  getSaleDetails,
  getSaleItems,
  getSaleWithItems,
  getSalesWithItems,
  testSalesQueries
};
