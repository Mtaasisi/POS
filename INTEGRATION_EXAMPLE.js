// 🚀 INTEGRATION EXAMPLE - Replace Your Current Code
// This shows exactly how to replace your problematic query

// ❌ REMOVE THIS CODE (causes 400 error):
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

// ✅ REPLACE WITH THIS CODE (works reliably):

// Step 1: Import the working functions
import { getSalesData, getSalesDataJSON, getSalesDataSimplified, getSalesDataSeparate } from './REPLACE_YOUR_QUERY.js';

// Step 2: Replace your current query with one of these:

// OPTION A: Smart function (tries all approaches automatically)
const loadSales = async (supabase) => {
  try {
    const sales = await getSalesData(supabase);
    return sales;
  } catch (error) {
    console.error('Error loading sales:', error);
    return [];
  }
};

// OPTION B: JSON aggregation (most efficient)
const loadSalesJSON = async (supabase) => {
  try {
    const sales = await getSalesDataJSON(supabase);
    return sales;
  } catch (error) {
    console.error('Error loading sales:', error);
    return [];
  }
};

// OPTION C: Simplified approach (fallback)
const loadSalesSimplified = async (supabase) => {
  try {
    const sales = await getSalesDataSimplified(supabase);
    return sales;
  } catch (error) {
    console.error('Error loading sales:', error);
    return [];
  }
};

// OPTION D: Separate queries (most reliable)
const loadSalesSeparate = async (supabase) => {
  try {
    const sales = await getSalesDataSeparate(supabase);
    return sales;
  } catch (error) {
    console.error('Error loading sales:', error);
    return [];
  }
};

// 🧪 TEST YOUR IMPLEMENTATION:
import { testAllApproaches } from './REPLACE_YOUR_QUERY.js';

const testSalesQueries = async (supabase) => {
  console.log('🧪 Testing all sales query approaches...');
  const results = await testAllApproaches(supabase);
  console.log('📊 Test Results:', results);
  return results;
};

// 🎯 USAGE IN YOUR COMPONENT:
/*
// In your React component or Vue component:
const [sales, setSales] = useState([]);
const [loading, setLoading] = useState(false);

const fetchSales = async () => {
  setLoading(true);
  try {
    // Use the smart function (recommended)
    const salesData = await getSalesData(supabase);
    setSales(salesData);
  } catch (error) {
    console.error('Error fetching sales:', error);
  } finally {
    setLoading(false);
  }
};

// Call it when component mounts
useEffect(() => {
  fetchSales();
}, []);
*/

// 🚀 QUICK START:
// 1. Copy REPLACE_YOUR_QUERY.js to your project
// 2. Import the functions you need
// 3. Replace your current query with getSalesData(supabase)
// 4. Test it to ensure the 400 error is gone

export {
  loadSales,
  loadSalesJSON,
  loadSalesSimplified,
  loadSalesSeparate,
  testSalesQueries
};
