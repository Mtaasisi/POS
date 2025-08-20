// Optimized WhatsApp Service with Pagination
import { supabase } from '../../../lib/supabaseClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  profile_image?: string;
  created_at: string;
}

interface PaginationParams {
  page: number;
  pageSize: number;
  lastProcessedId?: string;
  lastProcessedTimestamp?: string;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private processedCustomers = new Set<string>();
  private isProcessing = false;

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Optimized customer fetching with pagination
  async fetchCustomersWithPagination(params: PaginationParams): Promise<{
    customers: Customer[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    try {
      const { page, pageSize, lastProcessedId, lastProcessedTimestamp } = params;
      
      let query = supabase
        .from('customers')
        .select('id,name,phone,whatsapp,profile_image,created_at')
        .not('whatsapp', 'is', null)
        .not('whatsapp', 'eq', '');

      // Use timestamp-based filtering for better performance
      if (lastProcessedTimestamp) {
        query = query.gt('created_at', lastProcessedTimestamp);
      }

      // Use cursor-based pagination instead of offset
      if (lastProcessedId) {
        query = query.gt('id', lastProcessedId);
      }

      // Limit results to prevent large queries
      query = query.limit(pageSize).order('created_at', { ascending: true });

      const { data: customers, error } = await query;

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      // Filter out already processed customers
      const unprocessedCustomers = customers?.filter(
        customer => !this.processedCustomers.has(customer.id)
      ) || [];

      const hasMore = customers && customers.length === pageSize;
      const nextCursor = hasMore && customers ? customers[customers.length - 1].id : undefined;

      return {
        customers: unprocessedCustomers,
        hasMore,
        nextCursor
      };
    } catch (error) {
      console.error('Error in fetchCustomersWithPagination:', error);
      throw error;
    }
  }

  // Batch process customers to avoid memory issues
  async processCustomersInBatches(
    batchSize: number = 50,
    maxBatches: number = 10
  ): Promise<Customer[]> {
    if (this.isProcessing) {
      console.log('⏳ Processing already in progress, waiting...');
      return [];
    }

    this.isProcessing = true;
    const allCustomers: Customer[] = [];
    let currentCursor: string | undefined;
    let batchCount = 0;

    try {
      while (batchCount < maxBatches) {
        const result = await this.fetchCustomersWithPagination({
          page: batchCount + 1,
          pageSize: batchSize,
          lastProcessedId: currentCursor
        });

        if (result.customers.length === 0) {
          break;
        }

        allCustomers.push(...result.customers);
        
        // Mark customers as processed
        result.customers.forEach(customer => {
          this.processedCustomers.add(customer.id);
        });

        currentCursor = result.nextCursor;
        batchCount++;

        // Add a small delay to prevent overwhelming the API
        if (result.hasMore && batchCount < maxBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!result.hasMore) {
          break;
        }
      }

      console.log(`✅ Processed ${allCustomers.length} customers in ${batchCount} batches`);
      return allCustomers;
    } catch (error) {
      console.error('Error processing customers in batches:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Alternative method using timestamp-based filtering
  async fetchRecentCustomers(
    hoursBack: number = 24,
    limit: number = 100
  ): Promise<Customer[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const { data: customers, error } = await supabase
        .from('customers')
        .select('id,name,phone,whatsapp,profile_image,created_at')
        .not('whatsapp', 'is', null)
        .not('whatsapp', 'eq', '')
        .gte('created_at', cutoffTime.toISOString())
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent customers:', error);
        throw error;
      }

      return customers || [];
    } catch (error) {
      console.error('Error in fetchRecentCustomers:', error);
      throw error;
    }
  }

  // Clear processed customers cache
  clearProcessedCache(): void {
    this.processedCustomers.clear();
  }

  // Get processing status
  getProcessingStatus(): boolean {
    return this.isProcessing;
  }
}

export const whatsappService = WhatsAppService.getInstance();
