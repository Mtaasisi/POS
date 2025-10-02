// Quality Check Service
import { supabase } from '../../../lib/supabaseClient';
import type {
  QualityCheckTemplate,
  QualityCheckCriteria,
  PurchaseOrderQualityCheck,
  QualityCheckItem,
  QualityCheckSummary,
  CreateQualityCheckParams,
  UpdateQualityCheckItemParams,
  CompleteQualityCheckParams
} from '../types/quality-check';

export class QualityCheckService {
  // Fallback methods for when database functions are not available
  static async createQualityCheckFallback(params: CreateQualityCheckParams): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
      console.log('🔄 Creating quality check using fallback method:', params);
      
      // Create quality check record directly
      const { data: qualityCheck, error: qcError } = await supabase
        .from('purchase_order_quality_checks')
        .insert({
          purchase_order_id: params.purchaseOrderId,
          template_id: params.templateId,
          checked_by: params.checkedBy,
          status: 'in_progress'
        })
        .select('id')
        .single();

      if (qcError) throw qcError;
      if (!qualityCheck?.id) throw new Error('Failed to create quality check record');

      // Get template criteria
      const { data: criteria, error: criteriaError } = await supabase
        .from('quality_check_criteria')
        .select('*')
        .eq('template_id', params.templateId)
        .order('sort_order');

      if (criteriaError) throw criteriaError;

      // Get purchase order items
      const { data: poItems, error: poItemsError } = await supabase
        .from('lats_purchase_order_items')
        .select('*')
        .eq('purchase_order_id', params.purchaseOrderId);

      if (poItemsError) throw poItemsError;

      // Create quality check items
      if (criteria && poItems) {
        const itemsToInsert = [];
        for (const criterion of criteria) {
          for (const poItem of poItems) {
            itemsToInsert.push({
              quality_check_id: qualityCheck.id,
              purchase_order_item_id: poItem.id,
              criteria_id: criterion.id,
              criteria_name: criterion.name
            });
          }
        }

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('purchase_order_quality_check_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return {
        success: true,
        data: qualityCheck.id,
        message: 'Quality check created successfully (fallback method)'
      };
    } catch (error) {
      console.error('❌ Error in fallback quality check creation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create quality check using fallback method'
      };
    }
  }
  // Templates
  static async getTemplates(): Promise<{ success: boolean; data?: QualityCheckTemplate[]; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('quality_check_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        data: data?.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          isActive: t.is_active,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }))
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch templates'
      };
    }
  }

  static async getTemplateCriteria(templateId: string): Promise<{ success: boolean; data?: QualityCheckCriteria[]; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('quality_check_criteria')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order');

      if (error) throw error;

      return {
        success: true,
        data: data?.map((c: any) => ({
          id: c.id,
          templateId: c.template_id,
          name: c.name,
          description: c.description,
          isRequired: c.is_required,
          sortOrder: c.sort_order,
          createdAt: c.created_at
        }))
      };
    } catch (error) {
      console.error('Error fetching criteria:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch criteria'
      };
    }
  }

  // Quality Checks
  static async createQualityCheck(params: CreateQualityCheckParams): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
      console.log('🔄 Creating quality check with params:', params);
      
      const { data, error } = await supabase
        .rpc('create_quality_check_from_template', {
          p_purchase_order_id: params.purchaseOrderId,
          p_template_id: params.templateId,
          p_checked_by: params.checkedBy
        });

      if (error) {
        console.error('❌ RPC error creating quality check:', error);
        throw error;
      }

      console.log('✅ Quality check created successfully:', data);

      return {
        success: true,
        data: data,
        message: 'Quality check created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating quality check:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create quality check';
      if (error instanceof Error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          errorMessage = 'Quality check system not properly configured. Please contact administrator.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid purchase order or template ID provided.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to create quality checks.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Try fallback method if RPC function fails
      if (errorMessage.includes('not properly configured')) {
        console.log('🔄 Attempting fallback method for quality check creation...');
        return await this.createQualityCheckFallback(params);
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static async getQualityCheck(id: string): Promise<{ success: boolean; data?: PurchaseOrderQualityCheck; message?: string }> {
    try {
      // Validate id
      if (!id || id === '' || id === 'undefined') {
        console.error('Invalid quality check ID provided:', id);
        return {
          success: false,
          message: 'Invalid quality check ID'
        };
      }

      const { data, error } = await supabase
        .from('purchase_order_quality_checks')
        .select(`
          *,
          template:quality_check_templates(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          purchaseOrderId: data.purchase_order_id,
          templateId: data.template_id,
          status: data.status,
          overallResult: data.overall_result,
          checkedBy: data.checked_by,
          checkedAt: data.checked_at,
          notes: data.notes,
          signature: data.signature,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          template: data.template ? {
            id: data.template.id,
            name: data.template.name,
            description: data.template.description,
            category: data.template.category,
            isActive: data.template.is_active,
            createdAt: data.template.created_at,
            updatedAt: data.template.updated_at
          } : undefined
        }
      };
    } catch (error) {
      console.error('Error fetching quality check:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch quality check'
      };
    }
  }

  static async getQualityChecksByPO(purchaseOrderId: string): Promise<{ success: boolean; data?: PurchaseOrderQualityCheck[]; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('purchase_order_quality_checks')
        .select(`
          *,
          template:quality_check_templates(*)
        `)
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data?.map((qc: any) => ({
          id: qc.id,
          purchaseOrderId: qc.purchase_order_id,
          templateId: qc.template_id,
          status: qc.status,
          overallResult: qc.overall_result,
          checkedBy: qc.checked_by,
          checkedAt: qc.checked_at,
          notes: qc.notes,
          signature: qc.signature,
          createdAt: qc.created_at,
          updatedAt: qc.updated_at,
          template: qc.template ? {
            id: qc.template.id,
            name: qc.template.name,
            description: qc.template.description,
            category: qc.template.category,
            isActive: qc.template.is_active,
            createdAt: qc.template.created_at,
            updatedAt: qc.template.updated_at
          } : undefined
        }))
      };
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch quality checks'
      };
    }
  }

  // Quality Check Items
  static async getQualityCheckItems(qualityCheckId: string): Promise<{ success: boolean; data?: QualityCheckItem[]; message?: string }> {
    try {
      // Validate qualityCheckId
      if (!qualityCheckId || qualityCheckId === '' || qualityCheckId === 'undefined') {
        console.error('Invalid quality check ID provided:', qualityCheckId);
        return {
          success: false,
          message: 'Invalid quality check ID'
        };
      }

      const { data, error } = await supabase
        .from('purchase_order_quality_check_items')
        .select(`
          *,
          criteria:quality_check_criteria(*),
          purchase_order_item:lats_purchase_order_items(
            id,
            product_id,
            variant_id,
            quantity,
            product:lats_products(name, sku),
            variant:lats_product_variants(name, sku)
          )
        `)
        .eq('quality_check_id', qualityCheckId)
        .order('created_at');

      if (error) throw error;

      return {
        success: true,
        data: data?.map((item: any) => ({
          id: item.id,
          qualityCheckId: item.quality_check_id,
          purchaseOrderItemId: item.purchase_order_item_id,
          criteriaId: item.criteria_id,
          criteriaName: item.criteria_name,
          result: item.result,
          quantityChecked: item.quantity_checked,
          quantityPassed: item.quantity_passed,
          quantityFailed: item.quantity_failed,
          defectType: item.defect_type,
          defectDescription: item.defect_description,
          actionTaken: item.action_taken,
          notes: item.notes,
          images: item.images || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          criteria: item.criteria ? {
            id: item.criteria.id,
            templateId: item.criteria.template_id,
            name: item.criteria.name,
            description: item.criteria.description,
            isRequired: item.criteria.is_required,
            sortOrder: item.criteria.sort_order,
            createdAt: item.criteria.created_at
          } : undefined,
          purchaseOrderItem: item.purchase_order_item ? {
            id: item.purchase_order_item.id,
            productId: item.purchase_order_item.product_id,
            variantId: item.purchase_order_item.variant_id,
            quantity: item.purchase_order_item.quantity,
            product: item.purchase_order_item.product ? {
              name: item.purchase_order_item.product.name,
              sku: item.purchase_order_item.product.sku
            } : undefined,
            variant: item.purchase_order_item.variant ? {
              name: item.purchase_order_item.variant.name,
              sku: item.purchase_order_item.variant.sku
            } : undefined
          } : undefined
        }))
      };
    } catch (error) {
      console.error('Error fetching quality check items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch quality check items'
      };
    }
  }

  static async updateQualityCheckItem(params: UpdateQualityCheckItemParams): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('purchase_order_quality_check_items')
        .update({
          result: params.result,
          quantity_checked: params.quantityChecked,
          quantity_passed: params.quantityPassed,
          quantity_failed: params.quantityFailed,
          defect_type: params.defectType,
          defect_description: params.defectDescription,
          action_taken: params.actionTaken,
          notes: params.notes,
          images: params.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (error) throw error;

      return {
        success: true,
        message: 'Quality check item updated successfully'
      };
    } catch (error) {
      console.error('Error updating quality check item:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update quality check item'
      };
    }
  }

  static async completeQualityCheck(params: CompleteQualityCheckParams): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔄 Completing quality check with params:', params);
      
      const { data, error } = await supabase
        .rpc('complete_quality_check', {
          p_quality_check_id: params.qualityCheckId,
          p_notes: params.notes,
          p_signature: params.signature
        });

      if (error) {
        console.error('❌ RPC error completing quality check:', error);
        throw error;
      }

      console.log('✅ Quality check completed successfully:', data);

      return {
        success: true,
        message: 'Quality check completed successfully'
      };
    } catch (error) {
      console.error('❌ Error completing quality check:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to complete quality check';
      if (error instanceof Error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          errorMessage = 'Quality check completion system not properly configured. Please contact administrator.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Quality check not found. It may have been deleted or the ID is invalid.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to complete this quality check.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid data provided for quality check completion.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  static async getQualityCheckSummary(purchaseOrderId: string): Promise<{ success: boolean; data?: QualityCheckSummary; message?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('get_quality_check_summary', {
          p_purchase_order_id: purchaseOrderId
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: true,
          data: undefined,
          message: 'No quality check found'
        };
      }

      return {
        success: true,
        data: {
          qualityCheckId: data[0].quality_check_id,
          status: data[0].status,
          overallResult: data[0].overall_result,
          checkedBy: data[0].checked_by,
          checkedAt: data[0].checked_at,
          totalItems: data[0].total_items,
          passedItems: data[0].passed_items,
          failedItems: data[0].failed_items,
          pendingItems: data[0].pending_items
        }
      };
    } catch (error) {
      console.error('Error fetching quality check summary:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch quality check summary'
      };
    }
  }

  static async receiveQualityCheckedItems(
    qualityCheckId: string,
    purchaseOrderId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('receive_quality_checked_items', {
          p_quality_check_id: qualityCheckId,
          p_purchase_order_id: purchaseOrderId
        });

      if (error) throw error;

      return {
        success: true,
        message: data?.message || 'Quality-checked items received to inventory successfully'
      };
    } catch (error) {
      console.error('Error receiving quality-checked items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to receive items to inventory'
      };
    }
  }
}
