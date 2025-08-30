import { ProductFormData, CategoryFormData, SupplierFormData } from '../types/inventory';

export class LatsDataTransformer {
  private static instance: LatsDataTransformer;
  
  private constructor() {}
  
  static getInstance(): LatsDataTransformer {
    if (!LatsDataTransformer.instance) {
      LatsDataTransformer.instance = new LatsDataTransformer();
    }
    return LatsDataTransformer.instance;
  }

  // UUID validation helper
  private isValidUUID(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Transform NewInventoryPage form data to ProductFormData
  transformNewInventoryFormData(formData: any): ProductFormData {
    const transformedData: ProductFormData = {
      name: formData.name || '',
      description: formData.description || '',
      shortDescription: formData.description || '',
      sku: formData.product_code || this.generateSKU(formData.name),
    
      categoryId: this.isValidUUID(formData.category_id) ? formData.category_id : '',

      supplierId: this.isValidUUID(formData.supplier_id) ? formData.supplier_id : undefined,
      images: [],
      isActive: formData.is_active ?? true,
      variants: []
    };

    // Transform variants
    if (formData.variants && formData.variants.length > 0) {
      transformedData.variants = formData.variants.map((variant: any, index: number) => ({
        sku: variant.sku || `${transformedData.sku}-${index + 1}`,
        name: variant.variant_name || `Variant ${index + 1}`,
    
        price: variant.selling_price || 0,
        costPrice: variant.cost_price || 0,
        stockQuantity: variant.quantity_in_stock || 0,
        minStockLevel: formData.minimum_stock_level || 0,

        attributes: variant.attributes || {},
        isActive: true
      }));
    } else {
      // Create default variant for simple products
      transformedData.variants = [{
        sku: transformedData.sku,
        name: 'Default',
    
        price: formData.selling_price || 0,
        costPrice: formData.cost_price || 0,
        stockQuantity: formData.quantity_in_stock || 0,
        minStockLevel: formData.minimum_stock_level || 0,

        attributes: {},
        isActive: true
      }];
    }

    return transformedData;
  }

  // Transform ProductFormData to API format
  transformProductFormDataToApi(data: ProductFormData): any {
    return {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      sku: data.sku,
      barcode: data.barcode,
      categoryId: this.isValidUUID(data.categoryId) ? data.categoryId : '',

      supplierId: this.isValidUUID(data.supplierId || '') ? data.supplierId : undefined,
      images: data.images || [],
      isActive: data.isActive,
      variants: data.variants.map(variant => ({
        sku: variant.sku,
        name: variant.name,
        barcode: variant.barcode,
        price: variant.price || 0, // Use price from ProductFormData
        costPrice: variant.costPrice,
        quantity: variant.quantity || variant.stockQuantity || 0,
        minQuantity: variant.minQuantity || variant.minStockLevel || 0,

        attributes: variant.attributes
      }))
    };
  }

  // Transform API response to ProductFormData
  transformApiResponseToProductFormData(apiData: any): ProductFormData {
    return {
      name: apiData.name || '',
      description: apiData.description || '',
      shortDescription: apiData.shortDescription || '',
      sku: apiData.sku || '',
      barcode: apiData.barcode || '',
      categoryId: apiData.categoryId || apiData.category_id || '',

      supplierId: apiData.supplierId || apiData.supplier_id || undefined,
      images: apiData.images || [],
      variants: (apiData.variants || []).map((variant: any) => ({
        sku: variant.sku || '',
        name: variant.name || '',
        barcode: variant.barcode || '',
        sellingPrice: variant.selling_price || variant.sellingPrice || variant.price || 0,
        costPrice: variant.costPrice || variant.cost_price || 0,
        stockQuantity: variant.stockQuantity || variant.quantity || 0,
        minStockLevel: variant.minStockLevel || variant.min_quantity || 0,


        attributes: variant.attributes || {},
        isActive: variant.isActive ?? true
      }))
    };
  }

  // Transform category form data
  transformCategoryFormData(data: any): CategoryFormData {
    return {
      name: data.name || '',
      description: data.description || '',
      color: data.color || '#3B82F6',
      icon: data.icon || undefined,
      parentId: data.parentId || undefined,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder || 0,
      metadata: data.metadata || {}
    };
  }



  // Transform supplier form data
  transformSupplierFormData(data: any): SupplierFormData {
    return {
      name: data.name || '',
      code: data.code || undefined,
      contactPerson: data.contactPerson || data.contact_person || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || 'Tanzania',
      paymentTerms: data.paymentTerms || data.payment_terms || undefined,
      leadTimeDays: data.leadTimeDays || data.lead_time_days || 7,
      isActive: data.isActive ?? true,
      metadata: data.metadata || {}
    };
  }

  // Generate SKU from product name
  private generateSKU(productName: string): string {
    if (!productName) return 'SKU-' + Date.now();
    
    const cleanName = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    
    // Add more randomness to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return cleanName + '-' + timestamp + '-' + randomSuffix;
  }

  // Public method to generate SKU
  generateSimpleSKU(productName: string): string {
    return this.generateSKU(productName);
  }

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



  // Parse dimensions string to object
  private parseDimensions(dimensionsString: string): { length?: number; width?: number; height?: number } | undefined {
    if (!dimensionsString) return undefined;
    
    const parts = dimensionsString.split('x').map(part => parseFloat(part.trim()));
    
    if (parts.length >= 3 && parts.every(part => !isNaN(part))) {
      return {
        length: parts[0],
        width: parts[1],
        height: parts[2]
      };
    }
    
    return undefined;
  }

  // Transform dimensions object to string
  transformDimensionsToString(dimensions: { length?: number; width?: number; height?: number } | undefined): string {
    if (!dimensions) return '';
    
    const parts = [
      dimensions.length,
      dimensions.width,
      dimensions.height
    ].filter(part => part !== undefined);
    
    return parts.join('x');
  }

  // Transform product data for display
  transformProductForDisplay(product: any): any {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId || product.category_id,

      supplierId: product.supplierId || product.supplier_id,
      images: product.images || [],
      tags: [],
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      isDigital: product.isDigital ?? false,
      requiresShipping: product.requiresShipping ?? true,
      taxRate: product.taxRate || 0,
      totalQuantity: product.totalQuantity || 0,
      totalValue: product.totalValue || 0,
      variants: (product.variants || []).map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        barcode: variant.barcode,
        price: variant.price || variant.sellingPrice || 0,
        costPrice: variant.costPrice || 0,
        stockQuantity: variant.stockQuantity || variant.quantity || 0,
        minStockLevel: variant.minStockLevel || variant.minQuantity || 0,
        weight: variant.weight || undefined,
        dimensions: variant.dimensions || undefined,
        attributes: variant.attributes || {},
        isActive: variant.isActive ?? true
      })),
      category: product.category,

      supplier: product.supplier,
      createdAt: product.createdAt || product.created_at,
      updatedAt: product.updatedAt || product.updated_at
    };
  }

  // Transform category data for display
  transformCategoryForDisplay(category: any): any {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId || category.parent_id,
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder || category.sort_order || 0,
      metadata: category.metadata || {},
      createdAt: category.createdAt || category.created_at,
      updatedAt: category.updatedAt || category.updated_at
    };
  }



  // Transform supplier data for display
  transformSupplierForDisplay(supplier: any): any {
    return {
      id: supplier.id,
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson || supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      paymentTerms: supplier.paymentTerms || supplier.payment_terms,
      leadTimeDays: supplier.leadTimeDays || supplier.lead_time_days,
      isActive: supplier.isActive ?? true,
      metadata: supplier.metadata || {},
      createdAt: supplier.createdAt || supplier.created_at,
      updatedAt: supplier.updatedAt || supplier.updated_at
    };
  }

  // Transform data for CSV export
  transformProductForCSV(product: any): any {
    const mainVariant = product.variants?.[0];
    return {
      Name: product.name,
      SKU: mainVariant?.sku || product.sku || '',
      Category: product.category?.name || '',

      Description: product.description || '',
      CostPrice: mainVariant?.costPrice || 0,
      SellingPrice: mainVariant?.price || mainVariant?.sellingPrice || 0,
      StockQuantity: mainVariant?.stockQuantity || mainVariant?.quantity || 0,
      MinStockLevel: mainVariant?.minStockLevel || mainVariant?.minQuantity || 0,
      Barcode: mainVariant?.barcode || product.barcode || '',
      Weight: mainVariant?.weight || '',
      Dimensions: mainVariant?.dimensions ? this.transformDimensionsToString(mainVariant.dimensions) : '',
      Status: product.isActive ? 'Active' : 'Inactive',
              Tags: '',
      CreatedAt: product.createdAt || product.created_at || '',
      UpdatedAt: product.updatedAt || product.updated_at || ''
    };
  }

  // Transform CSV data to product form data
  transformCSVToProductFormData(csvData: any): ProductFormData {
    return {
      name: csvData.Name || csvData.name || '',
      description: csvData.Description || csvData.description || '',
      shortDescription: csvData.Description || csvData.description || '',
      sku: csvData.SKU || csvData.sku || this.generateSKU(csvData.Name || csvData.name),
      barcode: csvData.Barcode || csvData.barcode || '',
      categoryId: '', // Will need to be resolved

      supplierId: undefined, // Will need to be resolved
      images: [],
      tags: csvData.Tags ? csvData.Tags.split(',').map((tag: string) => tag.trim()) : [],
      isActive: (csvData.Status || csvData.status || 'Active').toLowerCase() === 'active',
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      taxRate: 0,
      variants: [{
        sku: csvData.SKU || csvData.sku || this.generateSKU(csvData.Name || csvData.name),
        name: 'Default',
        barcode: csvData.Barcode || csvData.barcode || '',
        price: parseFloat(csvData.SellingPrice || csvData.sellingPrice || csvData.price || '0'),
        costPrice: parseFloat(csvData.CostPrice || csvData.costPrice || '0'),
        stockQuantity: parseInt(csvData.StockQuantity || csvData.stockQuantity || csvData.quantity || '0'),
        minStockLevel: parseInt(csvData.MinStockLevel || csvData.minStockLevel || '0'),
        weight: csvData.Weight || csvData.weight ? parseFloat(csvData.Weight || csvData.weight) : undefined,
        dimensions: csvData.Dimensions || csvData.dimensions ? this.parseDimensions(csvData.Dimensions || csvData.dimensions) : undefined,
        attributes: {},
        isActive: true
      }]
    };
  }
}

// Export singleton instance
export const latsDataTransformer = LatsDataTransformer.getInstance();

// Export convenience functions
export const transformNewInventoryFormData = (formData: any) => 
  latsDataTransformer.transformNewInventoryFormData(formData);

export const transformProductFormDataToApi = (data: ProductFormData) => 
  latsDataTransformer.transformProductFormDataToApi(data);

export const transformApiResponseToProductFormData = (apiData: any) => 
  latsDataTransformer.transformApiResponseToProductFormData(apiData);

export const transformCategoryFormData = (data: any) => 
  latsDataTransformer.transformCategoryFormData(data);



export const transformSupplierFormData = (data: any) => 
  latsDataTransformer.transformSupplierFormData(data);

export const transformProductForDisplay = (product: any) => 
  latsDataTransformer.transformProductForDisplay(product);

export const transformCategoryForDisplay = (category: any) => 
  latsDataTransformer.transformCategoryForDisplay(category);



export const transformSupplierForDisplay = (supplier: any) => 
  latsDataTransformer.transformSupplierForDisplay(supplier);

export const transformProductForCSV = (product: any) => 
  latsDataTransformer.transformProductForCSV(product);

export const transformCSVToProductFormData = (csvData: any) => 
  latsDataTransformer.transformCSVToProductFormData(csvData);

export const generateSimpleSKU = (productName: string) => 
  latsDataTransformer.generateSimpleSKU(productName);
