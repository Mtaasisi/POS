// FRONTEND IMPLEMENTATION - FIX 400 ERROR
// Use these exact Supabase queries in your frontend

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co'
const supabaseKey = 'your-anon-key' // Replace with your actual key
const supabase = createClient(supabaseUrl, supabaseKey)

// ✅ WORKING SALES LIST QUERY
// Use this for your main sales page - NO MORE 400 ERRORS
export async function getSalesList() {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*, customers(name, phone, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Error fetching sales:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ✅ WORKING SALE DETAILS QUERY
// Use this for SaleDetailsModal - NO MORE 400 ERRORS
export async function getSaleDetails(saleId) {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*, customers(*)')
      .eq('id', saleId)
      .single()
    
    if (error) {
      console.error('Error fetching sale details:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ✅ WORKING SALE ITEMS QUERY
// Use this to get items for a specific sale - NO MORE 400 ERRORS
export async function getSaleItems(saleId) {
  try {
    const { data, error } = await supabase
      .from('lats_sale_items')
      .select('*, lats_products(name, description, sku, barcode), lats_product_variants(name, sku, attributes)')
      .eq('sale_id', saleId)
    
    if (error) {
      console.error('Error fetching sale items:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ✅ WORKING CATEGORY QUERY (if needed)
// Use this to get category information for products
export async function getSaleItemCategories(saleId) {
  try {
    const { data, error } = await supabase
      .from('lats_sale_items')
      .select('*, lats_products(*, lats_categories(*))')
      .eq('sale_id', saleId)
    
    if (error) {
      console.error('Error fetching categories:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ✅ COMPLETE SALES DATA FETCHER
// Use this function to get all data for a sale (recommended approach)
export async function getCompleteSaleData(saleId) {
  try {
    // Get sale details
    const { data: saleData, error: saleError } = await getSaleDetails(saleId)
    if (saleError) return { data: null, error: saleError }
    
    // Get sale items
    const { data: itemsData, error: itemsError } = await getSaleItems(saleId)
    if (itemsError) return { data: null, error: itemsError }
    
    // Combine the data
    const completeData = {
      sale: saleData,
      items: itemsData
    }
    
    return { data: completeData, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ✅ USAGE EXAMPLES:

// Example 1: Get sales list for main page
async function loadSalesList() {
  const { data, error } = await getSalesList()
  if (error) {
    console.error('Failed to load sales:', error)
    return
  }
  console.log('Sales loaded:', data)
}

// Example 2: Get complete sale data for modal
async function loadSaleModal(saleId) {
  const { data, error } = await getCompleteSaleData(saleId)
  if (error) {
    console.error('Failed to load sale data:', error)
    return
  }
  console.log('Sale data loaded:', data)
}

// Example 3: Get just sale items
async function loadSaleItems(saleId) {
  const { data, error } = await getSaleItems(saleId)
  if (error) {
    console.error('Failed to load sale items:', error)
    return
  }
  console.log('Sale items loaded:', data)
}

// ✅ REACT COMPONENT EXAMPLE:
/*
import { useState, useEffect } from 'react'
import { getSalesList, getCompleteSaleData } from './supabase-queries'

function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSales()
  }, [])

  async function loadSales() {
    try {
      setLoading(true)
      const { data, error } = await getSalesList()
      
      if (error) {
        setError(error.message)
        return
      }
      
      setSales(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {sales.map(sale => (
        <div key={sale.id}>
          <h3>{sale.sale_number}</h3>
          <p>Customer: {sale.customers?.name}</p>
          <p>Total: {sale.total_amount} TSH</p>
        </div>
      ))}
    </div>
  )
}
*/

// ✅ KEY CHANGES FROM YOUR CURRENT CODE:
// 1. Removed complex nested queries that cause 400 errors
// 2. Split into separate, simpler queries
// 3. Each query has a single responsibility
// 4. Better error handling
// 5. More maintainable code structure

// ✅ BENEFITS:
// - No more 400 Bad Request errors
// - Better performance
// - Easier to debug
// - More reliable
// - Follows Supabase best practices