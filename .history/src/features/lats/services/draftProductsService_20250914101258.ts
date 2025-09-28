// Draft Products Service
// Manages the workflow from purchase orders to draft products to inventory

import { supabase } from '../../../lib/supabaseClient';
import { 
  ShippingCargoItem, 
  ProductValidation, 
  Product, 
  ShippingInfo,
  PurchaseOrderItem 
} from '../types/inventory';

export interface DraftProductWorkflowResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ShipmentValidationStatus {
  isReady: boolean;
  totalProducts: number;
  validatedProducts: number;
  missingProducts: number;
  cargoItems: ShippingCargoItem[];
  validations: ProductValidation[];
}

class DraftProductsService {
  
  /**
   * Create draft products from purchase order items when shipping is created
   */
  async createDraftProductsFromPO(
    purchaseOrderId: string, 
    shippingId: string
  ): Promise<DraftProductWorkflowResult> {
    try {
      console.log('🔄 [DraftProductsService] Creating draft products from PO:', purchaseOrderId);
      
      const { data, error } = await supabase.rpc('create_draft_products_from_po', {
        p_purchase_order_id: purchaseOrderId,
        p_shipping_id: shippingId
      });

      if (error) {
        console.error('❌ [DraftProductsService] Error creating draft products:', error);
        return { success: false, message: error.message };
      }

      const result = data[0];
      console.log('✅ [DraftProductsService] Draft products created:', result);
      
      return {
        success: result.success,
        message: result.success 
          ? `Created ${result.products_created} draft products`
          : result.error_message || 'Failed to create draft products',
        data: result
      };
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all cargo items (draft products) for a shipment
   */
  async getShipmentCargoItems(shippingId: string): Promise<ShippingCargoItem[]> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_cargo_items')
        .select(`
          *,
          product:lats_products(*),
          purchase_order_item:lats_purchase_order_items(*)
        `)
        .eq('shipping_id', shippingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [DraftProductsService] Error fetching cargo items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Get validation status for all products in a shipment
   */
  async getShipmentValidationStatus(shippingId: string): Promise<ShipmentValidationStatus> {
    try {
      // Get cargo items
      const cargoItems = await this.getShipmentCargoItems(shippingId);
      
      // Get validation records
      const { data: validations, error: validationError } = await supabase
        .from('lats_product_validation')
        .select(`
          *,
          product:lats_products(*)
        `)
        .eq('shipping_id', shippingId);

      if (validationError) {
        console.error('❌ [DraftProductsService] Error fetching validations:', validationError);
        throw validationError;
      }

      // Check if shipment is ready for inventory
      const { data: readyCheck, error: readyError } = await supabase.rpc(
        'check_shipment_ready_for_inventory',
        { p_shipping_id: shippingId }
      );

      if (readyError) {
        console.error('❌ [DraftProductsService] Error checking readiness:', readyError);
        throw readyError;
      }

      const status = readyCheck[0];
      
      return {
        isReady: status.is_ready,
        totalProducts: status.total_products,
        validatedProducts: status.validated_products,
        missingProducts: status.missing_products,
        cargoItems,
        validations: (validations as ProductValidation[]) || []
      };
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Validate a draft product (mark as validated)
   */
  async validateDraftProduct(
    productId: string,
    shippingId: string,
    validationErrors: string[] = [],
    productUpdates?: {
      costPrice?: number;
      sellingPrice?: number;
      supplierId?: string;
      categoryId?: string;
      productName?: string;
      productDescription?: string;
      notes?: string;
    }
  ): Promise<DraftProductWorkflowResult> {
    try {
      console.log('🔄 [DraftProductsService] Validating draft product:', productId);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const isValidated = validationErrors.length === 0;
      
      // Prepare validation data with product updates
      const validationData: any = {
        product_id: productId,
        shipping_id: shippingId,
        is_validated: isValidated,
        validation_errors: validationErrors,
        validated_by: isValidated ? user.id : null,
        validated_at: isValidated ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      // Add product updates if provided
      if (productUpdates) {
        if (productUpdates.costPrice !== undefined) {
          validationData.updated_cost_price = productUpdates.costPrice;
        }
        if (productUpdates.sellingPrice !== undefined) {
          validationData.updated_selling_price = productUpdates.sellingPrice;
        }
        if (productUpdates.supplierId !== undefined) {
          validationData.updated_supplier_id = productUpdates.supplierId;
        }
        if (productUpdates.categoryId !== undefined) {
          validationData.updated_category_id = productUpdates.categoryId;
        }
        if (productUpdates.productName !== undefined) {
          validationData.updated_product_name = productUpdates.productName;
        }
        if (productUpdates.productDescription !== undefined) {
          validationData.updated_product_description = productUpdates.productDescription;
        }
        if (productUpdates.notes !== undefined) {
          validationData.updated_notes = productUpdates.notes;
        }
      }

      console.log('💾 [DraftProductsService] Saving validation with updates:', validationData);

      // Upsert validation record
      const { data, error } = await supabase
        .from('lats_product_validation')
        .upsert(validationData, {
          onConflict: 'product_id,shipping_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [DraftProductsService] Error validating product:', error);
        return { success: false, message: error.message };
      }

      console.log('✅ [DraftProductsService] Product validation updated:', data);
      
      return {
        success: true,
        message: isValidated 
          ? 'Product validated successfully'
          : `Product validation failed: ${validationErrors.join(', ')}`,
        data
      };
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Move all validated products to inventory
   */
  async moveProductsToInventory(
    shippingId: string
  ): Promise<DraftProductWorkflowResult> {
    try {
      console.log('🔄 [DraftProductsService] Moving products to inventory for shipment:', shippingId);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Call the database function
      const { data, error } = await supabase.rpc('move_products_to_inventory', {
        p_shipping_id: shippingId,
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ [DraftProductsService] Error moving products to inventory:', error);
        return { success: false, message: error.message };
      }

      const result = data[0];
      console.log('✅ [DraftProductsService] Products moved to inventory:', result);
      
      if (!result.success) {
        return { success: false, message: result.error_message };
      }


      return {
        success: true,
        message: `Successfully moved ${result.products_moved} products to inventory`,
        data: result
      };
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get draft products that need validation for a shipment
   */
  async getDraftProductsForValidation(shippingId: string): Promise<Product[]> {
    try {
      console.log('🚀 [DraftProductsService] ENHANCED DEBUG - Fetching draft products for shipping ID:', shippingId);
      
      // First, let's check what cargo items exist
      const { data: cargoItems, error: cargoError } = await supabase
        .from('lats_shipping_cargo_items')
        .select('*')
        .eq('shipping_id', shippingId);

      if (cargoError) {
        console.error('❌ [DraftProductsService] Error fetching cargo items:', cargoError);
        throw cargoError;
      }

      console.log('📦 [DraftProductsService] Raw cargo items (no join):', cargoItems);
      
      // Check if cargo items exist but products are missing
      if (cargoItems && cargoItems.length > 0) {
        console.log('📦 [DraftProductsService] Found cargo items, checking if products exist...');
        for (const item of cargoItems) {
          console.log('📦 [DraftProductsService] Cargo item product_id:', item.product_id);
          
          // Check if the product exists
          const { data: product, error: productError } = await supabase
            .from('lats_products')
            .select('id, name, status')
            .eq('id', item.product_id)
            .single();
            
          if (productError) {
            console.error('❌ [DraftProductsService] Product not found:', item.product_id, productError);
          } else {
            console.log('✅ [DraftProductsService] Product found:', product);
          }
        }
      }
      
      // Now try the join query - include cargo item fields (quantity, cost_price) from PO
      const { data, error } = await supabase
        .from('lats_shipping_cargo_items')
        .select(`
          id,
          quantity,
          cost_price,
          description,
          notes,
          purchase_order_item_id,
          product:lats_products(
            *,
            category:lats_categories(*),
            supplier:lats_suppliers(*),
            variants:lats_product_variants(*)
          ),
          purchase_order_item:lats_purchase_order_items(
            *,
            purchase_order:lats_purchase_orders(
              currency,
              exchange_rate,
              base_currency
            )
          )
        `)
        .eq('shipping_id', shippingId);

      if (error) {
        console.error('❌ [DraftProductsService] Error fetching draft products:', error);
        throw error;
      }

      console.log('📦 [DraftProductsService] Raw cargo items data (with join):', data);
      
      if (data && data.length > 0) {
        console.log('📦 [DraftProductsService] Sample cargo item:', data[0]);
        console.log('📦 [DraftProductsService] Sample product data:', data[0]?.product);
      }
      
      // Map cargo items to include both product data and PO data with currency conversion
      const products = (data?.map(item => {
        if (!item.product) return null;
        
        // Get exchange rate information from purchase order
        const poCurrency = item.purchase_order_item?.purchase_order?.currency;
        const exchangeRate = item.purchase_order_item?.purchase_order?.exchange_rate;
        const baseCurrency = item.purchase_order_item?.purchase_order?.base_currency;
        
        // Calculate converted cost price
        let convertedCostPrice = item.cost_price;
        if (poCurrency && poCurrency !== 'TZS' && exchangeRate && exchangeRate > 0) {
          // Convert from foreign currency to TZS using exchange rate
          convertedCostPrice = item.cost_price * exchangeRate;
          console.log(`💰 [DraftProductsService] Currency conversion: ${item.cost_price} ${poCurrency} × ${exchangeRate} = ${convertedCostPrice} TZS`);
        } else if (poCurrency === 'TZS' || !poCurrency) {
          console.log(`💰 [DraftProductsService] No conversion needed: ${item.cost_price} TZS`);
        } else {
          console.log(`⚠️ [DraftProductsService] Missing exchange rate for ${poCurrency}, using original price: ${item.cost_price}`);
        }
        
        // Create a product object that includes both product data and PO data
        const productWithPOData = {
          ...item.product,
          // Override with PO data from cargo item
          stockQuantity: item.quantity, // Quantity from PO
          costPrice: convertedCostPrice, // Converted cost price in TZS
          // Keep other PO-related fields
          purchaseOrderItemId: item.purchase_order_item_id,
          cargoItemId: item.id,
          cargoDescription: item.description,
          cargoNotes: item.notes,
          // Add currency information for debugging
          originalCurrency: poCurrency,
          exchangeRate: exchangeRate,
          baseCurrency: baseCurrency
        };
        
        return productWithPOData;
      }).filter(Boolean) as Product[]) || [];
      
      console.log('📦 [DraftProductsService] Filtered products with PO data:', products.length);
      
      if (products.length > 0) {
        console.log('📦 [DraftProductsService] Sample product with PO data:', products[0]);
        console.log('📦 [DraftProductsService] PO quantity:', products[0].stockQuantity);
        console.log('📦 [DraftProductsService] PO cost price (converted):', products[0].costPrice);
        console.log('📦 [DraftProductsService] Original currency:', products[0].originalCurrency);
        console.log('📦 [DraftProductsService] Exchange rate:', products[0].exchangeRate);
      }
      
      return products;
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Update a draft product with complete information
   * This function can update both draft and active products
   * Updated to remove status restriction for better compatibility
   */
  async updateDraftProduct(
    productId: string,
    productData: Partial<Product>
  ): Promise<DraftProductWorkflowResult> {
    try {
      console.log('🔄 [DraftProductsService] Updating product:', productId);
      
      // First check the current status of the product
      const { data: currentProduct, error: fetchError } = await supabase
        .from('lats_products')
        .select('status')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('❌ [DraftProductsService] Error fetching product status:', fetchError);
        return { success: false, message: fetchError.message };
      }

      console.log('📋 [DraftProductsService] Current product status:', currentProduct.status);
      console.log('📋 [DraftProductsService] Update data being sent:', productData);
      
      // DEBUG: Log detailed update information
      console.log('🔍 [DraftProductsService] DEBUG - Detailed update info:', {
        productId,
        currentStatus: currentProduct.status,
        updateFields: Object.keys(productData),
        updateValues: productData,
        hasSellingPrice: 'selling_price' in productData,
        hasMinStockLevel: 'min_stock_level' in productData,
        hasStorageRoom: 'storage_room_id' in productData,
        hasStoreShelf: 'store_shelf_id' in productData,
        hasImages: 'images' in productData
      });
      
      // Clean the update data - convert empty strings to null for foreign key fields
      const cleanedProductData = {
        ...productData,
        // Convert empty strings to null for foreign key fields
        storage_room_id: productData.storage_room_id === '' ? null : productData.storage_room_id,
        store_shelf_id: productData.store_shelf_id === '' ? null : productData.store_shelf_id,
        // Validate selling price to prevent database overflow (max 99,999,999.99)
        selling_price: (() => {
          if (productData.selling_price && productData.selling_price > 99999999.99) {
            console.warn('⚠️ [DraftProductsService] Selling price capped from', productData.selling_price, 'to 99,999,999.99 due to database field limit');
            return 99999999.99;
          }
          return productData.selling_price;
        })(),
        updated_at: new Date().toISOString()
      };

      console.log('🧹 [DraftProductsService] Cleaned update data:', cleanedProductData);
      
      // Update the product (remove status restriction to allow updating both draft and active products)
      const { data, error } = await supabase
        .from('lats_products')
        .update(cleanedProductData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('❌ [DraftProductsService] Error updating product:', error);
        console.error('❌ [DraftProductsService] Error details:', error.details);
        console.error('❌ [DraftProductsService] Error hint:', error.hint);
        console.error('❌ [DraftProductsService] Error code:', error.code);
        console.error('❌ [DraftProductsService] Full error object:', JSON.stringify(error, null, 2));
        return { 
          success: false, 
          message: `Database error: ${error.message}${error.details ? ` (${error.details})` : ''}${error.hint ? ` - ${error.hint}` : ''}` 
        };
      }

      console.log('✅ [DraftProductsService] Product updated successfully:', data);
      
      // DEBUG: Log what was actually updated in the database
      console.log('🔍 [DraftProductsService] DEBUG - Product after update:', {
        id: data.id,
        name: data.name,
        selling_price: data.selling_price,
        min_stock_level: data.min_stock_level,
        storage_room_id: data.storage_room_id,
        store_shelf_id: data.store_shelf_id,
        images: data.images,
        status: data.status,
        updated_at: data.updated_at
      });
      
      return {
        success: true,
        message: 'Product updated successfully',
        data
      };
    } catch (error) {
      console.error('❌ [DraftProductsService] Unexpected error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }


  /**
   * Check if a shipment can transition to 'received' status
   */
  async canTransitionToReceived(shippingId: string): Promise<boolean> {
    try {
      const status = await this.getShipmentValidationStatus(shippingId);
      return status.isReady && status.validatedProducts > 0;
    } catch (error) {
      console.error('❌ [DraftProductsService] Error checking transition eligibility:', error);
      return false;
    }
  }
}

// Export singleton instance
export const draftProductsService = new DraftProductsService();
export default draftProductsService;
