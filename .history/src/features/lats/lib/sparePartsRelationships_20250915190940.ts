// Spare Parts Relationship Fetching Service
// Handles fetching related data for spare parts (devices, suppliers, categories, usage history)

import { supabase } from '../../../lib/supabaseClient';
import { SparePart, SparePartUsage } from '../types/spareParts';

export interface DeviceCompatibility {
  id: string;
  spare_part_id: string;
  device_brand: string;
  device_model: string;
  device_type: string;
  compatibility_notes?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SparePartWithRelations extends SparePart {
  device_compatibilities?: DeviceCompatibility[];
  usage_history?: SparePartUsage[];
  related_spare_parts?: SparePart[];
  supplier_details?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    website?: string;
    rating?: number;
    total_orders?: number;
    last_order_date?: string;
  };
  category_details?: {
    id: string;
    name: string;
    description?: string;
    parent_category?: string;
    total_parts_in_category?: number;
    similar_parts?: SparePart[];
  };
}

export interface SparePartRelationshipFilters {
  include_device_compatibility?: boolean;
  include_usage_history?: boolean;
  include_related_parts?: boolean;
  include_supplier_details?: boolean;
  include_category_details?: boolean;
  usage_history_limit?: number;
  related_parts_limit?: number;
}

class SparePartsRelationshipService {
  private static instance: SparePartsRelationshipService;

  public static getInstance(): SparePartsRelationshipService {
    if (!SparePartsRelationshipService.instance) {
      SparePartsRelationshipService.instance = new SparePartsRelationshipService();
    }
    return SparePartsRelationshipService.instance;
  }

  /**
   * Fetch spare part with all relationships
   */
  async getSparePartWithRelations(
    sparePartId: string,
    filters: SparePartRelationshipFilters = {}
  ): Promise<SparePartWithRelations | null> {
    try {
      console.log('🔍 [SparePartsRelationshipService] Fetching spare part with relationships:', sparePartId);

      // Get base spare part data
      const { data: sparePart, error: sparePartError } = await supabase
        .from('lats_spare_parts')
        .select(`
          *,
          category:lats_categories(name, description),
          supplier:lats_suppliers(name, email, phone, address)
        `)
        .eq('id', sparePartId)
        .single();

      if (sparePartError) {
        console.error('❌ Error fetching spare part:', sparePartError);
        return null;
      }

      if (!sparePart) {
        console.warn('⚠️ Spare part not found:', sparePartId);
        return null;
      }

      const result: SparePartWithRelations = { ...sparePart };

      // Fetch device compatibilities if requested
      if (filters.include_device_compatibility !== false) {
        result.device_compatibilities = await this.getDeviceCompatibilities(sparePartId);
      }

      // Fetch usage history if requested
      if (filters.include_usage_history !== false) {
        result.usage_history = await this.getUsageHistory(
          sparePartId, 
          filters.usage_history_limit || 10
        );
      }

      // Fetch related spare parts if requested
      if (filters.include_related_parts !== false) {
        result.related_spare_parts = await this.getRelatedSpareParts(
          sparePartId,
          filters.related_parts_limit || 5
        );
      }

      // Fetch supplier details if requested
      if (filters.include_supplier_details !== false && sparePart.supplier_id) {
        result.supplier_details = await this.getSupplierDetails(sparePart.supplier_id);
      }

      // Fetch category details if requested
      if (filters.include_category_details !== false && sparePart.category_id) {
        result.category_details = await this.getCategoryDetails(sparePart.category_id);
      }

      console.log('✅ [SparePartsRelationshipService] Successfully fetched spare part with relationships');
      return result;

    } catch (error) {
      console.error('❌ [SparePartsRelationshipService] Error fetching spare part with relationships:', error);
      return null;
    }
  }

  /**
   * Fetch device compatibilities for a spare part
   */
  async getDeviceCompatibilities(sparePartId: string): Promise<DeviceCompatibility[]> {
    try {
      const { data, error } = await supabase
        .from('lats_device_compatibility')
        .select('*')
        .eq('spare_part_id', sparePartId)
        .order('device_brand', { ascending: true })
        .order('device_model', { ascending: true });

      if (error) {
        console.error('❌ Error fetching device compatibilities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching device compatibilities:', error);
      return [];
    }
  }

  /**
   * Fetch usage history for a spare part
   */
  async getUsageHistory(sparePartId: string, limit: number = 10): Promise<SparePartUsage[]> {
    try {
      // First try with device join, if it fails, fall back to simple query
      let { data, error } = await supabase
        .from('lats_spare_part_usage')
        .select(`
          *,
          lats_devices!device_id(name, model, serial_number)
        `)
        .eq('spare_part_id', sparePartId)
        .order('used_at', { ascending: false })
        .limit(limit);

      // If the join fails, try without the device join
      if (error && error.code === 'PGRST116') {
        console.warn('⚠️ Device join failed, falling back to simple query:', error.message);
        const simpleQuery = await supabase
          .from('lats_spare_part_usage')
          .select('*')
          .eq('spare_part_id', sparePartId)
          .order('used_at', { ascending: false })
          .limit(limit);
        
        data = simpleQuery.data;
        error = simpleQuery.error;
      }

      if (error) {
        console.error('❌ Error fetching usage history:', error);
        return [];
      }

      // Transform the data to match the expected interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        spare_part_id: item.spare_part_id,
        quantity_used: item.quantity, // Map quantity to quantity_used
        device_id: item.device_id,
        reason: item.reason,
        notes: item.notes,
        used_by: item.used_by,
        created_at: item.used_at, // Map used_at to created_at
        device: item.lats_devices
      }));

      return transformedData;
    } catch (error) {
      console.error('❌ Error fetching usage history:', error);
      return [];
    }
  }

  /**
   * Fetch related spare parts (same category, similar name, or same supplier)
   */
  async getRelatedSpareParts(sparePartId: string, limit: number = 5): Promise<SparePart[]> {
    try {
      // First get the current spare part to find related ones
      const { data: currentSparePart, error: currentError } = await supabase
        .from('lats_spare_parts')
        .select('category_id, supplier_id, name')
        .eq('id', sparePartId)
        .single();

      if (currentError || !currentSparePart) {
        console.error('❌ Error fetching current spare part for related parts:', currentError);
        return [];
      }

      // Find related spare parts by category, supplier, or similar name
      let query = supabase
        .from('lats_spare_parts')
        .select(`
          *,
          category:lats_categories(name),
          supplier:lats_suppliers(name)
        `)
        .neq('id', sparePartId)
        .eq('is_active', true);

      // Build OR conditions safely, handling null values
      const orConditions = [];
      if (currentSparePart.category_id) {
        orConditions.push(`category_id.eq.${currentSparePart.category_id}`);
      }
      if (currentSparePart.supplier_id) {
        orConditions.push(`supplier_id.eq.${currentSparePart.supplier_id}`);
      }
      if (currentSparePart.name) {
        const firstWord = currentSparePart.name.split(' ')[0];
        if (firstWord) {
          orConditions.push(`name.ilike.%${firstWord}%`);
        }
      }

      // Only apply OR filter if we have valid conditions
      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('❌ Error fetching related spare parts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching related spare parts:', error);
      return [];
    }
  }

  /**
   * Fetch detailed supplier information
   */
  async getSupplierDetails(supplierId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lats_suppliers')
        .select(`
          *,
          lats_purchase_orders(id, created_at, status)
        `)
        .eq('id', supplierId)
        .single();

      if (error) {
        console.error('❌ Error fetching supplier details:', error);
        return null;
      }

      if (!data) return null;

      // Calculate supplier statistics
      const totalOrders = data.purchase_orders?.length || 0;
      const lastOrderDate = data.purchase_orders?.length > 0 
        ? data.purchase_orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0].created_at
        : null;

      return {
        ...data,
        total_orders: totalOrders,
        last_order_date: lastOrderDate,
        rating: 4.5 // Placeholder - could be calculated from order success rate
      };
    } catch (error) {
      console.error('❌ Error fetching supplier details:', error);
      return null;
    }
  }

  /**
   * Fetch detailed category information
   */
  async getCategoryDetails(categoryId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lats_categories')
        .select(`
          *,
          parent_category:lats_categories(name),
          spare_parts:lats_spare_parts(id, name, quantity, is_active)
        `)
        .eq('id', categoryId)
        .single();

      if (error) {
        console.error('❌ Error fetching category details:', error);
        return null;
      }

      if (!data) return null;

      // Calculate category statistics
      const totalPartsInCategory = data.spare_parts?.filter((part: any) => part.is_active).length || 0;
      const similarParts = data.spare_parts?.filter((part: any) => part.is_active).slice(0, 5) || [];

      return {
        ...data,
        total_parts_in_category: totalPartsInCategory,
        similar_parts: similarParts
      };
    } catch (error) {
      console.error('❌ Error fetching category details:', error);
      return null;
    }
  }

  /**
   * Add device compatibility for a spare part
   */
  async addDeviceCompatibility(
    sparePartId: string,
    deviceBrand: string,
    deviceModel: string,
    deviceType: string,
    compatibilityNotes?: string,
    isVerified: boolean = false
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lats_device_compatibility')
        .insert({
          spare_part_id: sparePartId,
          device_brand: deviceBrand,
          device_model: deviceModel,
          device_type: deviceType,
          compatibility_notes: compatibilityNotes,
          is_verified: isVerified
        });

      if (error) {
        console.error('❌ Error adding device compatibility:', error);
        return false;
      }

      console.log('✅ Device compatibility added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding device compatibility:', error);
      return false;
    }
  }

  /**
   * Remove device compatibility
   */
  async removeDeviceCompatibility(compatibilityId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lats_device_compatibility')
        .delete()
        .eq('id', compatibilityId);

      if (error) {
        console.error('❌ Error removing device compatibility:', error);
        return false;
      }

      console.log('✅ Device compatibility removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error removing device compatibility:', error);
      return false;
    }
  }

  /**
   * Search spare parts by device compatibility
   */
  async searchSparePartsByDevice(
    deviceBrand: string,
    deviceModel: string,
    deviceType: string
  ): Promise<SparePart[]> {
    try {
      const { data, error } = await supabase
        .from('lats_device_compatibility')
        .select(`
          *,
          spare_part:lats_spare_parts(
            *,
            category:lats_categories(name),
            supplier:lats_suppliers(name)
          )
        `)
        .eq('device_brand', deviceBrand)
        .eq('device_model', deviceModel)
        .eq('device_type', deviceType)
        .eq('is_verified', true);

      if (error) {
        console.error('❌ Error searching spare parts by device:', error);
        return [];
      }

      return data?.map((item: any) => item.spare_part).filter(Boolean) || [];
    } catch (error) {
      console.error('❌ Error searching spare parts by device:', error);
      return [];
    }
  }
}

export default SparePartsRelationshipService;
