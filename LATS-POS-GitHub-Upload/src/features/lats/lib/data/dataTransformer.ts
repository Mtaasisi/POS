export class DataTransformer {
  // Generate unique SKU that doesn't exist in database
  async generateUniqueSKU(productName: string, supabase: any): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const sku = this.generateSKU(productName);
      
      // Check if SKU already exists
      const { data: existingVariant, error } = await supabase
        .from('lats_product_variants')
        .select('sku')
        .eq('sku', sku)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No record found, SKU is unique
        return sku;
      }
      
      if (existingVariant) {
        // SKU exists, try again
        attempts++;
        continue;
      }
      
      // If we get here, SKU is unique
      return sku;
    }
    
    // If we've tried too many times, use a timestamp-based approach
    return 'SKU-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Generate unique SKU for a variant within a product
  async generateUniqueVariantSKU(productName: string, existingSkus: string[], variantIndex: number = 0): Promise<string> {
    const baseSku = this.generateSimpleSKU(productName);
    let sku = variantIndex === 0 ? baseSku : `${baseSku}-VARIANT-${variantIndex + 1}`;
    
    // If this is the first variant and no SKU exists, use the base SKU
    if (variantIndex === 0 && existingSkus.length === 0) {
      return sku;
    }
    
    // Check if SKU already exists in the current product's variants
    let counter = 1;
    while (existingSkus.includes(sku)) {
      sku = `${baseSku}-VARIANT-${variantIndex + 1}-${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        sku = `${baseSku}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        break;
      }
    }
    
    return sku;
  }

  // Validate and fix SKUs for a product's variants
  validateAndFixSkus(variants: any[], productName: string): any[] {
    const fixedVariants = [...variants];
    const existingSkus = new Set<string>();
    
    fixedVariants.forEach((variant, index) => {
      let sku = variant.sku;
      
      // If SKU is empty or null, generate one
      if (!sku || sku.trim() === '') {
        sku = this.generateSimpleSKU(productName);
        if (index > 0) {
          sku = `${sku}-VARIANT-${index + 1}`;
        }
      }
      
      // If SKU already exists in this product, make it unique
      if (existingSkus.has(sku)) {
        const baseSku = sku.replace(/-VARIANT-\d+.*$/, '');
        let counter = 1;
        let newSku = `${baseSku}-VARIANT-${index + 1}`;
        
        while (existingSkus.has(newSku)) {
          newSku = `${baseSku}-VARIANT-${index + 1}-${counter}`;
          counter++;
        }
        sku = newSku;
      }
      
      existingSkus.add(sku);
      variant.sku = sku;
    });
    
    return fixedVariants;
  }

  // Generate a simple SKU from product name
  generateSimpleSKU(productName: string): string {
    if (!productName) return 'SKU-' + Date.now();
    
    // Remove special characters and convert to uppercase
    const cleanName = productName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toUpperCase()
      .substring(0, 8);
    
    return cleanName || 'SKU-' + Date.now();
  }

  // Generate SKU for a product
  generateSKU(productName: string): string {
    return this.generateSimpleSKU(productName);
  }
}
