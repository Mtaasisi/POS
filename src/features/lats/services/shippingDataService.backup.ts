// Shipping Data Service - Handles all shipping-related database operations
import { supabase } from '../../../lib/supabaseClient';
import { ShippingInfo, ShippingEvent } from '../types/inventory';

export interface ShippingDataService {
  // Get shipping info for a purchase order
  getShippingInfo(purchaseOrderId: string): Promise<ShippingInfo | null>;
  
  // Create new shipping info
  createShippingInfo(purchaseOrderId: string, shippingData: Partial<ShippingInfo>): Promise<ShippingInfo>;
  
  // Update existing shipping info
  updateShippingInfo(shippingId: string, updates: Partial<ShippingInfo>): Promise<ShippingInfo>;
  
  // Get shipping events for tracking
  getShippingEvents(shippingId: string): Promise<ShippingEvent[]>;
  
  // Add shipping event
  addShippingEvent(shippingId: string, event: Omit<ShippingEvent, 'id'>): Promise<ShippingEvent>;
  
  // Get all shipping info with filters
  getAllShippingInfo(filters?: {
    status?: string;
    carrierId?: string;
    agentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ShippingInfo[]>;
}

class ShippingDataServiceImpl implements ShippingDataService {
  
  async getShippingInfo(purchaseOrderId: string): Promise<ShippingInfo | null> {
    try {
      console.log('🚚 [ShippingDataService] Fetching shipping info for PO:', purchaseOrderId);
      
      const { data: shippingInfoData, error } = await supabase
        .from('lats_shipping_info')
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `)
        .eq('purchase_order_id', purchaseOrderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🚚 [ShippingDataService] No shipping info found for PO:', purchaseOrderId);
          return null;
        }
        console.error('❌ [ShippingDataService] Error fetching shipping info:', error);
        throw error;
      }

      if (!shippingInfoData) {
        return null;
      }

      // Transform to ShippingInfo format
      const shippingInfo: ShippingInfo = {
        id: shippingInfoData.id,
        carrier: shippingInfoData.carrier?.name || 'Unknown Carrier',
        carrierId: shippingInfoData.carrier_id,
        trackingNumber: shippingInfoData.tracking_number,
        method: 'Standard',
        cost: shippingInfoData.cost || 0,
        notes: shippingInfoData.notes || '',
        agentId: shippingInfoData.agent_id || '',
        agent: shippingInfoData.agent ? {
          id: shippingInfoData.agent.id,
          name: shippingInfoData.agent.name,
          company: shippingInfoData.agent.company,
          phone: shippingInfoData.agent.phone,
          email: shippingInfoData.agent.email,
          isActive: shippingInfoData.agent.is_active
        } : null,
        managerId: shippingInfoData.manager_id || '',
        manager: shippingInfoData.manager ? {
          id: shippingInfoData.manager.id,
          name: shippingInfoData.manager.name,
          department: shippingInfoData.manager.department,
          phone: shippingInfoData.manager.phone,
          email: shippingInfoData.manager.email
        } : null,
        estimatedDelivery: shippingInfoData.estimated_delivery || '',
        shippedDate: '',
        deliveredDate: shippingInfoData.actual_delivery || '',
        portOfLoading: '',
        portOfDischarge: '',
        pricePerCBM: 0,
        enableInsurance: shippingInfoData.enable_insurance || false,
        requireSignature: shippingInfoData.require_signature || false,
        status: shippingInfoData.status || 'pending',
        cargoBoxes: [],
        trackingEvents: []
      };

      // Fetch tracking events
      const events = await this.getShippingEvents(shippingInfoData.id);
      shippingInfo.trackingEvents = events;

      console.log('✅ [ShippingDataService] Successfully fetched shipping info:', {
        id: shippingInfo.id,
        trackingNumber: shippingInfo.trackingNumber,
        carrier: shippingInfo.carrier,
        status: shippingInfo.status,
        eventsCount: events.length
      });

      return shippingInfo;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in getShippingInfo:', error);
      throw error;
    }
  }

  async createShippingInfo(purchaseOrderId: string, shippingData: Partial<ShippingInfo>): Promise<ShippingInfo> {
    try {
      console.log('🚚 [ShippingDataService] Creating shipping info for PO:', purchaseOrderId);
      console.log('🚚 [ShippingDataService] Shipping data received:', shippingData);
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ [ShippingDataService] Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      if (!user) {
        console.error('❌ [ShippingDataService] No authenticated user found');
        throw new Error('No authenticated user found');
      }
      console.log('✅ [ShippingDataService] User authenticated:', user.email);
      
      const insertData = {
        purchase_order_id: purchaseOrderId,
        carrier_id: shippingData.carrierId || null,
        agent_id: shippingData.agentId || null,
        manager_id: shippingData.managerId || null,
        tracking_number: shippingData.trackingNumber || '',
        status: shippingData.status || 'pending',
        estimated_delivery: shippingData.estimatedDelivery || null,
        cost: shippingData.cost || 0,
        require_signature: shippingData.requireSignature || false,
        enable_insurance: shippingData.enableInsurance || false,
        notes: shippingData.notes || null,
        // Shipping method
        shipping_method: shippingData.shippingMethod || 'standard',
        // Sea shipping fields
        port_of_loading: shippingData.portOfLoading || null,
        port_of_discharge: shippingData.portOfDischarge || null,
        departure_date: shippingData.departureDate || null,
        arrival_date: shippingData.arrivalDate || null,
        vessel_name: shippingData.vesselName || null,
        container_number: shippingData.containerNumber || null,
        // Air shipping fields
        flight_number: shippingData.flightNumber || null,
        departure_airport: shippingData.departureAirport || null,
        arrival_airport: shippingData.arrivalAirport || null,
        departure_time: shippingData.departureTime || null,
        arrival_time: shippingData.arrivalTime || null,
        // Cargo and pricing fields
        cargo_boxes: shippingData.cargoBoxes ? JSON.stringify(shippingData.cargoBoxes) : '[]',
        price_per_cbm: shippingData.pricePerCBM || 0,
        total_cbm: shippingData.cargoBoxes ? 
          shippingData.cargoBoxes.reduce((total, box) => 
            total + ((box.length * box.width * box.height * box.quantity) / 1000000), 0
          ) : 0,
        // Additional fields
        shipping_origin: shippingData.shippingOrigin || null,
        shipping_destination: shippingData.shippingDestination || null
      };
      
      console.log('🚚 [ShippingDataService] Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('lats_shipping_info')
        .insert(insertData)
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `)
        .single();

      if (error) {
        console.error('❌ [ShippingDataService] Error creating shipping info:', error);
        console.error('❌ [ShippingDataService] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error messages
        if (error.code === '42501') {
          throw new Error('Authentication required: Please log in to assign shipping. The system requires proper authentication to save shipping data.');
        } else if (error.code === '23503') {
          throw new Error('Invalid data: The selected agent, carrier, or purchase order is not valid. Please refresh the page and try again.');
        } else if (error.code === '23505') {
          throw new Error('Duplicate tracking number: This tracking number is already in use. Please generate a new one.');
        } else if (error.code === 'PGRST116') {
          throw new Error('Database connection error: Unable to connect to the database. Please check your internet connection and try again.');
        } else {
          throw new Error(`Shipping assignment failed: ${error.message}. Please try again or contact support if the issue persists.`);
        }
      }

      // Transform to ShippingInfo format
      const shippingInfo: ShippingInfo = {
        id: data.id,
        carrier: data.carrier?.name || 'Unknown Carrier',
        carrierId: data.carrier_id,
        trackingNumber: data.tracking_number,
        method: 'Standard',
        cost: data.cost || 0,
        notes: data.notes || '',
        agentId: data.agent_id || '',
        agent: data.agent ? {
          id: data.agent.id,
          name: data.agent.name,
          company: data.agent.company,
          phone: data.agent.phone,
          email: data.agent.email,
          isActive: data.agent.is_active
        } : null,
        managerId: data.manager_id || '',
        manager: data.manager ? {
          id: data.manager.id,
          name: data.manager.name,
          department: data.manager.department,
          phone: data.manager.phone,
          email: data.manager.email
        } : null,
        estimatedDelivery: data.estimated_delivery || '',
        shippedDate: '',
        deliveredDate: data.actual_delivery || '',
        portOfLoading: '',
        portOfDischarge: '',
        pricePerCBM: 0,
        enableInsurance: data.enable_insurance || false,
        requireSignature: data.require_signature || false,
        status: data.status || 'pending',
        cargoBoxes: [],
        trackingEvents: []
      };

      console.log('✅ [ShippingDataService] Successfully created shipping info:', {
        id: shippingInfo.id,
        trackingNumber: shippingInfo.trackingNumber,
        carrier: shippingInfo.carrier
      });

      return shippingInfo;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in createShippingInfo:', error);
      throw error;
    }
  }

  async updateShippingInfo(shippingId: string, updates: Partial<ShippingInfo>): Promise<ShippingInfo> {
    try {
      console.log('🚚 [ShippingDataService] Updating shipping info:', shippingId);
      
      const updateData: any = {};
      
      if (updates.carrierId !== undefined) updateData.carrier_id = updates.carrierId;
      if (updates.agentId !== undefined) updateData.agent_id = updates.agentId;
      if (updates.managerId !== undefined) updateData.manager_id = updates.managerId;
      if (updates.trackingNumber !== undefined) updateData.tracking_number = updates.trackingNumber;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.estimatedDelivery !== undefined) updateData.estimated_delivery = updates.estimatedDelivery;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.requireSignature !== undefined) updateData.require_signature = updates.requireSignature;
      if (updates.enableInsurance !== undefined) updateData.enable_insurance = updates.enableInsurance;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.deliveredDate !== undefined) updateData.actual_delivery = updates.deliveredDate;

      const { data, error } = await supabase
        .from('lats_shipping_info')
        .update(updateData)
        .eq('id', shippingId)
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `)
        .single();

      if (error) {
        console.error('❌ [ShippingDataService] Error updating shipping info:', error);
        throw error;
      }

      // Transform to ShippingInfo format
      const shippingInfo: ShippingInfo = {
        id: data.id,
        carrier: data.carrier?.name || 'Unknown Carrier',
        carrierId: data.carrier_id,
        trackingNumber: data.tracking_number,
        method: 'Standard',
        cost: data.cost || 0,
        notes: data.notes || '',
        agentId: data.agent_id || '',
        agent: data.agent ? {
          id: data.agent.id,
          name: data.agent.name,
          company: data.agent.company,
          phone: data.agent.phone,
          email: data.agent.email,
          isActive: data.agent.is_active
        } : null,
        managerId: data.manager_id || '',
        manager: data.manager ? {
          id: data.manager.id,
          name: data.manager.name,
          department: data.manager.department,
          phone: data.manager.phone,
          email: data.manager.email
        } : null,
        estimatedDelivery: data.estimated_delivery || '',
        shippedDate: '',
        deliveredDate: data.actual_delivery || '',
        portOfLoading: '',
        portOfDischarge: '',
        pricePerCBM: 0,
        enableInsurance: data.enable_insurance || false,
        requireSignature: data.require_signature || false,
        status: data.status || 'pending',
        cargoBoxes: [],
        trackingEvents: []
      };

      console.log('✅ [ShippingDataService] Successfully updated shipping info:', {
        id: shippingInfo.id,
        trackingNumber: shippingInfo.trackingNumber,
        status: shippingInfo.status
      });

      return shippingInfo;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in updateShippingInfo:', error);
      throw error;
    }
  }

  async getShippingEvents(shippingId: string): Promise<ShippingEvent[]> {
    try {
      console.log('🚚 [ShippingDataService] Fetching shipping events for:', shippingId);
      
      const { data, error } = await supabase
        .from('lats_shipping_events')
        .select('*')
        .eq('shipping_id', shippingId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ [ShippingDataService] Error fetching shipping events:', error);
        throw error;
      }

      const events: ShippingEvent[] = (data || []).map(event => ({
        id: event.id,
        status: event.status,
        description: event.description,
        location: event.location || '',
        timestamp: event.timestamp,
        notes: event.notes || ''
      }));

      console.log('✅ [ShippingDataService] Successfully fetched shipping events:', {
        shippingId,
        eventsCount: events.length
      });

      return events;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in getShippingEvents:', error);
      throw error;
    }
  }

  async addShippingEvent(shippingId: string, event: Omit<ShippingEvent, 'id'>): Promise<ShippingEvent> {
    try {
      console.log('🚚 [ShippingDataService] Adding shipping event for:', shippingId);
      
      const insertData = {
        shipping_id: shippingId,
        status: event.status,
        description: event.description,
        location: event.location || null,
        notes: event.notes || null,
        is_automated: false
      };

      const { data, error } = await supabase
        .from('lats_shipping_events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ [ShippingDataService] Error adding shipping event:', error);
        throw error;
      }

      const newEvent: ShippingEvent = {
        id: data.id,
        status: data.status,
        description: data.description,
        location: data.location || '',
        timestamp: data.timestamp,
        notes: data.notes || ''
      };

      console.log('✅ [ShippingDataService] Successfully added shipping event:', {
        id: newEvent.id,
        status: newEvent.status,
        description: newEvent.description
      });

      return newEvent;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in addShippingEvent:', error);
      throw error;
    }
  }

  async getAllShippingInfo(filters?: {
    status?: string;
    carrierId?: string;
    agentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ShippingInfo[]> {
    try {
      console.log('🚚 [ShippingDataService] Fetching all shipping info with filters:', filters);
      
      let query = supabase
        .from('lats_shipping_info')
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.carrierId) {
        query = query.eq('carrier_id', filters.carrierId);
      }
      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [ShippingDataService] Error fetching all shipping info:', error);
        throw error;
      }

      const shippingInfoList: ShippingInfo[] = (data || []).map(item => ({
        id: item.id,
        carrier: item.carrier?.name || 'Unknown Carrier',
        carrierId: item.carrier_id,
        trackingNumber: item.tracking_number,
        method: 'Standard',
        cost: item.cost || 0,
        notes: item.notes || '',
        agentId: item.agent_id || '',
        agent: item.agent ? {
          id: item.agent.id,
          name: item.agent.name,
          company: item.agent.company,
          phone: item.agent.phone,
          email: item.agent.email,
          isActive: item.agent.is_active
        } : null,
        managerId: item.manager_id || '',
        manager: item.manager ? {
          id: item.manager.id,
          name: item.manager.name,
          department: item.manager.department,
          phone: item.manager.phone,
          email: item.manager.email
        } : null,
        estimatedDelivery: item.estimated_delivery || '',
        shippedDate: '',
        deliveredDate: item.actual_delivery || '',
        portOfLoading: '',
        portOfDischarge: '',
        pricePerCBM: 0,
        enableInsurance: item.enable_insurance || false,
        requireSignature: item.require_signature || false,
        status: item.status || 'pending',
        cargoBoxes: [],
        trackingEvents: []
      }));

      console.log('✅ [ShippingDataService] Successfully fetched all shipping info:', {
        count: shippingInfoList.length,
        filters
      });

      return shippingInfoList;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in getAllShippingInfo:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const shippingDataService = new ShippingDataServiceImpl();
export default shippingDataService;
