import { supabase } from '../../../lib/supabaseClient';
import { Product } from '../types/inventory';
import { draftProductsService } from './draftProductsService';
import { validateAndCreateDefaultVariant } from '../lib/variantUtils';

export interface ReceiveShipmentResult {
  success: boolean;
  message: string;
  data?: {
    productsCreated: number;
    productsUpdated: number;
    stockMovements: number;
  };
  error?: string;
}

export interface InventoryReceipt {
  shippingId: string;
  products: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    costPrice: number;
    location?: string;
  }>;
  receivedBy: string;
  receivedAt: string;
  notes?: string;
}

class InventoryService {
  /**
   * Receive a shipment into inventory
   * This function processes validated draft products and moves them to inventory
   */
  async receiveShipment(shippingId: string): Promise<ReceiveShipmentResult> {
    try {
      console.log('📦 [InventoryService] Receiving shipment:', shippingId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the draft products service to move products to inventory
      const result = await draftProductsService.moveProductsToInventory(shippingId);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Update purchase order status to received


      console.log('✅ [InventoryService] Shipment received successfully:', result);
      
      return {
        success: true,
        data: {
          productsCreated: result.data?.products_moved || 0,
          productsUpdated: 0,
          stockMovements: result.data?.products_moved || 0
        }
      };
    } catch (error) {
      console.error('❌ [InventoryService] Error receiving shipment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find product by description (simplified search)
   */
  private async findProductByDescription(description: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('lats_products')
        .select('*')
        .ilike('description', `%${description}%`)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data as Product;
    } catch {
      return null;
    }
  }

  /**
   * Update product stock
   */
  private async updateProductStock(
    productId: string,
    quantity: number,
    costPrice: number,
    userId: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get product variants
      const { data: variants, error: variantsError } = await supabase
        .from('lats_product_variants')
        .select('*')
        .eq('product_id', productId)
        .limit(1);

      if (variantsError || !variants || variants.length === 0) {
        return { success: false, error: 'No product variants found' };
      }

      const variant = variants[0];

      // Update stock quantity
      const { error: updateError } = await supabase
        .from('lats_product_variants')
        .update({
          quantity: variant.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', variant.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('lats_stock_movements')
        .insert({
          product_id: productId,
          variant_id: variant.id,
          type: 'in',
          quantity: quantity,
          previous_quantity: variant.quantity,
          new_quantity: variant.quantity + quantity,
          reason: 'Shipment receipt',
          reference: `Shipment receipt`,
          notes: notes,
          created_by: userId
        });

      if (movementError) {
        console.warn('⚠️ [InventoryService] Failed to create stock movement:', movementError);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create new product from cargo box
   */
  private async createProductFromCargoBox(
    box: CargoBox,
    supplierId: string | undefined,
    userId: string,
    costPrice: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .insert({
          name: box.description || 'Unknown Product',
          description: box.description || '',
          category_id: null, // Will need to be set properly
          supplier_id: supplierId,
          brand_id: null,
          sku: `SHIP-${Date.now()}`,
          barcode: null,
          is_active: true,
          created_by: userId
        })
        .select()
        .single();

      if (productError || !product) {
        return { success: false, error: productError?.message || 'Failed to create product' };
      }

      // Create default variant using utility
      const defaultVariantResult = await validateAndCreateDefaultVariant(
        product.id,
        product.name,
        {
          costPrice: costPrice,
          sellingPrice: costPrice * 1.5, // 50% markup
          quantity: box.quantity,
          minQuantity: 0,
          sku: `SHIP-${Date.now()}-VAR`,
          attributes: {
            source: 'shipment',
            cargoBoxId: box.id
          }
        }
      );

      if (!defaultVariantResult.success) {
        // Roll back product creation if variant creation fails
        await supabase.from('lats_products').delete().eq('id', product.id);
        return { success: false, error: defaultVariantResult.error || 'Failed to create product variant' };
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('lats_stock_movements')
        .insert({
          product_id: product.id,
          variant_id: defaultVariantResult.variantId,
          type: 'in',
          quantity: box.quantity,
          previous_quantity: 0,
          new_quantity: box.quantity,
          reason: 'New product from shipment',
          reference: `New product from shipment`,
          notes: `Created from cargo box: ${box.description}`,
          created_by: userId
        });

      if (movementError) {
        console.warn('⚠️ [InventoryService] Failed to create stock movement:', movementError);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create inventory receipt record
   */
  private async createInventoryReceipt(receipt: InventoryReceipt): Promise<void> {
    try {
      const { error } = await supabase
        .from('lats_inventory_receipts')
        .insert({
          shipping_id: receipt.shippingId,
          products: receipt.products,
          received_by: receipt.receivedBy,
          received_at: receipt.receivedAt,
          notes: receipt.notes
        });

      if (error) {
        console.warn('⚠️ [InventoryService] Failed to create inventory receipt:', error);
      }
    } catch (error) {
      console.warn('⚠️ [InventoryService] Failed to create inventory receipt:', error);
    }
  }

  // Shipping-related function removed
  async validateProductCompleteness(shippingId: string): Promise<{
    isValid: boolean;
    missingFields: string[];
    products: Array<{
      name: string;
      isComplete: boolean;
      missingFields: string[];
    }>;
  }> {
    try {

      if (error || !shippingData) {
        return {
          isValid: false,
          missingFields: ['Shipping data not found'],
          products: []
        };
      }

      const cargoBoxes: CargoBox[] = shippingData.cargo_boxes 
        ? JSON.parse(shippingData.cargo_boxes) 
        : [];

      const products = [];
      let allValid = true;
      const allMissingFields: string[] = [];

      for (const box of cargoBoxes) {
        if (!box.description) continue;

        const product = await this.findProductByDescription(box.description);
        const missingFields: string[] = [];

        if (!product) {
          missingFields.push('Product not found');
          allValid = false;
        } else {
          if (!product.name) missingFields.push('Product name');
          if (!product.description) missingFields.push('Product description');
          if (!product.price || product.price <= 0) missingFields.push('Valid selling price');
          if (!product.costPrice || product.costPrice <= 0) missingFields.push('Valid cost price');
          if (!product.images || product.images.length === 0) missingFields.push('Product images');
        }

        products.push({
          name: box.description,
          isComplete: missingFields.length === 0,
          missingFields
        });

        allMissingFields.push(...missingFields);
      }

      return {
        isValid: allValid,
        missingFields: [...new Set(allMissingFields)],
        products
      };
    } catch (error) {
      console.error('❌ [InventoryService] Error validating product completeness:', error);
      return {
        isValid: false,
        missingFields: ['Validation error'],
        products: []
      };
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
export default inventoryService;
