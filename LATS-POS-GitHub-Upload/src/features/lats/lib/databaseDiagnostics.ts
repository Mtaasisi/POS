// Database Diagnostics Utility for LATS System

import { supabase } from '../../../lib/supabaseClient';

// Simplified interfaces for basic validation

// Simplified database diagnostics - removed complex schema queries to avoid import issues

/**
 * Validate product data against known database schema
 */
export const validateProductData = async (productData: any): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Known fields that exist in lats_products table
  const knownFields = [
    'id', 'name', 'description', 'category_id', 'brand_id', 'supplier_id',
    'condition', 'total_quantity', 'total_value', 'storage_room_id', 'store_shelf_id',
    'images', 'tags', 'attributes', 'metadata', 'created_at', 'updated_at',
    'sku', 'specification', 'cost_price', 'selling_price', 'stock_quantity', 'min_stock_level'
  ];

  // Check each field in the product data
  for (const [fieldName, value] of Object.entries(productData)) {
    if (!knownFields.includes(fieldName)) {
      errors.push(`Field '${fieldName}' may not exist in lats_products table`);
    }
  }

  // Check for required fields
  const requiredFields = ['name'];
  for (const fieldName of requiredFields) {
    if (!productData[fieldName]) {
      errors.push(`Required field '${fieldName}' is missing from product data`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Run basic database diagnostics
 */
export const runDatabaseDiagnostics = async (): Promise<{
  connection: boolean;
  authentication: boolean;
  tables: {
    lats_products: boolean;
    lats_categories: boolean;
    lats_suppliers: boolean;
    lats_product_variants: boolean;
  };
  errors: string[];
  recommendations: string[];
}> => {
  const result = {
    connection: false,
    authentication: false,
    tables: {
      lats_products: false,
      lats_categories: false,
      lats_suppliers: false,
      lats_product_variants: false,
    },
    errors: [],
    recommendations: []
  };

  try {
    // Test basic connection
    const { data, error } = await supabase.from('lats_categories').select('count').limit(1);
    if (error) {
      result.errors.push(`Connection error: ${error.message}`);
    } else {
      result.connection = true;
    }

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      result.errors.push(`Authentication error: ${authError.message}`);
    } else if (user) {
      result.authentication = true;
    } else {
      result.errors.push('No authenticated user found');
      result.recommendations.push('Please log in to access the database');
    }

    // Test table access
    const tables = [
      'lats_categories',
      'lats_suppliers',
      'lats_products',
      'lats_product_variants'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          result.errors.push(`${table} access error: ${error.message}`);
        } else {
          result.tables[table as keyof typeof result.tables] = true;
        }
      } catch (error) {
        result.errors.push(`${table} table error: ${error}`);
      }
    }

    // Generate recommendations
    if (!result.connection) {
      result.recommendations.push('Check Supabase URL and API key configuration');
    }
    
    if (!result.authentication) {
      result.recommendations.push('User must be authenticated to access LATS data');
    }

    const failedTables = Object.entries(result.tables)
      .filter(([_, accessible]) => !accessible)
      .map(([table]) => table);

    if (failedTables.length > 0) {
      result.recommendations.push(`Tables with access issues: ${failedTables.join(', ')}`);
    }

    return result;

  } catch (error) {
    result.errors.push(`Diagnostic failed: ${error}`);
    return result;
  }
};

/**
 * Log diagnostic results
 */
export const logDiagnosticResult = (result: any): void => {
  console.log('🔍 Database Diagnostic Results:');
  console.log('Connection:', result.connection ? '✅' : '❌');
  console.log('Authentication:', result.authentication ? '✅' : '❌');
  console.log('Tables:');
  Object.entries(result.tables).forEach(([table, accessible]) => {
    console.log(`  ${table}:`, accessible ? '✅' : '❌');
  });
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach((error: string) => console.log(`  - ${error}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    result.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
  }
};
