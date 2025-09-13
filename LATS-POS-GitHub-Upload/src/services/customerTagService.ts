import { supabase } from '../lib/supabaseClient';

export class CustomerTagService {
  static async getTagStatistics(): Promise<Record<string, number>> {
    try {
      // Check if tag column exists first
      const { data, error } = await supabase
        .from('customers')
        .select('id, color_tag')
        .not('color_tag', 'is', null);

      if (error) {
        console.error('Error fetching customer tag statistics:', error);
        return {};
      }

      const stats: Record<string, number> = {};
      data?.forEach(customer => {
        const tag = customer.color_tag || 'normal';
        stats[tag] = (stats[tag] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getTagStatistics:', error);
      return {};
    }
  }

  static async updateCustomerTag(customerId: string, tag: string): Promise<boolean> {
    try {
      console.log('🔧 CustomerTagService: Updating customer tag for ID:', customerId);
      console.log('🔧 CustomerTagService: New tag:', tag);
      
      const { error } = await supabase
        .from('customers')
        .update({ color_tag: tag })
        .eq('id', customerId);

      if (error) {
        console.error('❌ CustomerTagService: Error updating customer tag:', error);
        console.error('❌ CustomerTagService: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('✅ CustomerTagService: Successfully updated customer tag');
      return true;
    } catch (error) {
      console.error('❌ CustomerTagService: Error in updateCustomerTag:', error);
      return false;
    }
  }

  static async getCustomersByTag(tag: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('color_tag', tag);

      if (error) {
        console.error('Error fetching customers by tag:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCustomersByTag:', error);
      return [];
    }
  }
} 