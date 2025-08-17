import { supabase } from '../../../lib/supabaseClient';

export interface DatabaseDiagnosticResult {
  connection: boolean;
  authentication: boolean;
  tables: {
    lats_products: boolean;
    lats_categories: boolean;
    lats_brands: boolean;
    lats_suppliers: boolean;
    lats_product_variants: boolean;
  };
  errors: string[];
  recommendations: string[];
}

export async function runDatabaseDiagnostics(): Promise<DatabaseDiagnosticResult> {
  const result: DatabaseDiagnosticResult = {
    connection: false,
    authentication: false,
    tables: {
      lats_products: false,
      lats_categories: false,
      lats_brands: false,
      lats_suppliers: false,
      lats_product_variants: false,
    },
    errors: [],
    recommendations: []
  };

  try {
    console.log('🔍 Running database diagnostics...');

    // Test basic connection
    try {
      const { data, error } = await supabase.from('lats_categories').select('count').limit(1);
      if (error) {
        result.errors.push(`Connection error: ${error.message}`);
      } else {
        result.connection = true;
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      result.errors.push(`Connection failed: ${error}`);
    }

    // Test authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        result.errors.push(`Authentication error: ${error.message}`);
      } else if (user) {
        result.authentication = true;
        console.log('✅ User authenticated:', user.email);
      } else {
        result.errors.push('No authenticated user found');
        result.recommendations.push('Please log in to access the database');
      }
    } catch (error) {
      result.errors.push(`Authentication check failed: ${error}`);
    }

    // Test table access
    const tables = [
      'lats_categories',
      'lats_brands', 
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
          if (error.code === 'PGRST116') {
            result.recommendations.push(`RLS policy issue with ${table}. Check authentication.`);
          }
        } else {
          result.tables[table as keyof typeof result.tables] = true;
          console.log(`✅ ${table} table accessible`);
        }
      } catch (error) {
        result.errors.push(`${table} table error: ${error}`);
      }
    }

    // Test specific lats_products query that was failing
    try {
      const { data, error } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name),
          lats_brands(name),
          lats_suppliers(name),
          lats_product_variants(*)
        `)
        .limit(1);

      if (error) {
        result.errors.push(`Complex lats_products query error: ${error.message}`);
        result.recommendations.push('Check foreign key relationships and table names');
      } else {
        console.log('✅ Complex lats_products query successful');
      }
    } catch (error) {
      result.errors.push(`Complex query failed: ${error}`);
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

    console.log('📊 Database diagnostics completed');
    return result;

  } catch (error) {
    result.errors.push(`Diagnostic failed: ${error}`);
    return result;
  }
}

export function logDiagnosticResult(result: DatabaseDiagnosticResult): void {
  console.log('🔍 Database Diagnostic Results:');
  console.log('Connection:', result.connection ? '✅' : '❌');
  console.log('Authentication:', result.authentication ? '✅' : '❌');
  console.log('Tables:');
  Object.entries(result.tables).forEach(([table, accessible]) => {
    console.log(`  ${table}:`, accessible ? '✅' : '❌');
  });
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
}
