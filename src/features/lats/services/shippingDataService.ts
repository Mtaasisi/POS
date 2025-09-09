// Shipping Data Service - Handles all shipping-related database operations
import { supabase } from '../../../lib/supabaseClient';
import { ShippingInfo, ShippingEvent } from '../types/inventory';
import { isValidStatusTransition, hasStatusBeenUsed } from '../utils/shippingStatusFlow';

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

  // Get shipping info for a specific product
  getShippingInfoByProductId(productId: string): Promise<ShippingInfo[]>;
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
          agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
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
        console.log('🚚 [ShippingDataService] No shipping info data returned for PO:', purchaseOrderId);
        return null;
      }

      console.log('✅ [ShippingDataService] Shipping info found:', {
        id: shippingInfoData.id,
        trackingNumber: shippingInfoData.tracking_number,
        status: shippingInfoData.status
      });

      // Fetch cargo items (draft products) for this shipment
      const cargoItems = await this.getShippingCargoItems(shippingInfoData.id);

      // Transform to ShippingInfo format
      const shippingInfo: ShippingInfo = {
        id: shippingInfoData.id,
        carrier: shippingInfoData.carrier?.name || 'Unknown Carrier',
        carrierId: shippingInfoData.carrier_id,
        trackingNumber: shippingInfoData.tracking_number,
        method: shippingInfoData.shipping_method || 'Standard',
        shippingMethod: shippingInfoData.shipping_method || 'standard',
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
        portOfLoading: shippingInfoData.port_of_loading || '',
        portOfDischarge: shippingInfoData.port_of_discharge || '',
        pricePerCBM: shippingInfoData.price_per_cbm || 0,
        enableInsurance: shippingInfoData.enable_insurance || false,
        requireSignature: shippingInfoData.require_signature || false,
        status: shippingInfoData.status || 'pending',
        cargoBoxes: shippingInfoData.cargo_boxes ? JSON.parse(shippingInfoData.cargo_boxes) : [],
        cargoItems: cargoItems,
        trackingEvents: [],
        // Additional fields
        flightNumber: shippingInfoData.flight_number || '',
        departureAirport: shippingInfoData.departure_airport || '',
        arrivalAirport: shippingInfoData.arrival_airport || '',
        departureTime: shippingInfoData.departure_time || '',
        arrivalTime: shippingInfoData.arrival_time || '',
        vesselName: shippingInfoData.vessel_name || '',
        departureDate: shippingInfoData.departure_date || '',
        arrivalDate: shippingInfoData.arrival_date || '',
        containerNumber: shippingInfoData.container_number || '',
        // Additional tracking fields
        shippingOrigin: shippingInfoData.shipping_origin || '',
        shippingDestination: shippingInfoData.shipping_destination || '',
        totalCBM: shippingInfoData.total_cbm || 0
      };

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

      // Check if shipping info already exists for this purchase order
      console.log('🔍 [ShippingDataService] Checking for existing shipping info...');
      const { data: existingShipping, error: existingError } = await supabase
        .from('lats_shipping_info')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId);

      if (existingError) {
        console.error('❌ [ShippingDataService] Error checking existing shipping info:', existingError);
        throw new Error(`Error checking existing shipping info: ${existingError.message}`);
      }

      if (existingShipping && existingShipping.length > 0) {
        console.log('⚠️ [ShippingDataService] Found existing shipping info, updating instead of creating new');
        const existingId = existingShipping[0].id;
        
        // Update existing shipping info
        return await this.updateShippingInfo(existingId, shippingData);
      }

      console.log('✅ [ShippingDataService] No existing shipping info found, creating new');

      // Check for tracking number conflicts and generate unique one if needed
      let trackingNumber = shippingData.trackingNumber || '';
      if (trackingNumber) {
        console.log('🔍 [ShippingDataService] Checking tracking number uniqueness...');
        const { data: trackingConflict, error: trackingError } = await supabase
          .from('lats_shipping_info')
          .select('id')
          .eq('tracking_number', trackingNumber)
          .eq('carrier_id', shippingData.carrierId);

        if (trackingError) {
          console.error('❌ [ShippingDataService] Error checking tracking number:', trackingError);
        } else if (trackingConflict && trackingConflict.length > 0) {
          console.log('⚠️ [ShippingDataService] Tracking number conflict detected, generating new one...');
          trackingNumber = this.generateUniqueTrackingNumber(shippingData.carrierId);
          console.log('✅ [ShippingDataService] New tracking number generated:', trackingNumber);
        } else {
          console.log('✅ [ShippingDataService] Tracking number is unique');
        }
      } else {
        // Generate tracking number if not provided
        trackingNumber = this.generateUniqueTrackingNumber(shippingData.carrierId);
        console.log('✅ [ShippingDataService] Generated tracking number:', trackingNumber);
      }
      
      const insertData = {
        purchase_order_id: purchaseOrderId,
        carrier_id: shippingData.carrierId || null,
        agent_id: shippingData.agentId || null,
        manager_id: shippingData.managerId || null,
        tracking_number: trackingNumber,
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
          agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers!lats_shipping_info_manager_id_fkey(id, name, department, phone, email)
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
          throw new Error('Duplicate tracking number: This tracking number is already in use. The system will generate a new one automatically.');
        } else if (error.code === 'PGRST116') {
          throw new Error('Database connection error: Unable to connect to the database. Please check your internet connection and try again.');
        } else if (error.message && error.message.includes('409')) {
          throw new Error('Shipping assignment conflict: There may already be shipping information for this purchase order. The system will update the existing record instead.');
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
        method: data.shipping_method || 'Standard',
        shippingMethod: data.shipping_method || 'standard',
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
        portOfLoading: data.port_of_loading || '',
        portOfDischarge: data.port_of_discharge || '',
        pricePerCBM: data.price_per_cbm || 0,
        enableInsurance: data.enable_insurance || false,
        requireSignature: data.require_signature || false,
        status: data.status || 'pending',
        cargoBoxes: data.cargo_boxes ? JSON.parse(data.cargo_boxes) : [],
        cargoItems: [], // Will be populated separately
        trackingEvents: [],
        // Additional fields
        flightNumber: data.flight_number || '',
        departureAirport: data.departure_airport || '',
        arrivalAirport: data.arrival_airport || '',
        departureTime: data.departure_time || '',
        arrivalTime: data.arrival_time || '',
        vesselName: data.vessel_name || '',
        departureDate: data.departure_date || '',
        arrivalDate: data.arrival_date || '',
        containerNumber: data.container_number || ''
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
      console.log('🚚 [ShippingDataService] Updates:', updates);
      
      const updateData: any = {};
      
      // Map updates to database fields
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
      
      // Additional fields
      if (updates.shippingMethod !== undefined) updateData.shipping_method = updates.shippingMethod;
      if (updates.portOfLoading !== undefined) updateData.port_of_loading = updates.portOfLoading;
      if (updates.portOfDischarge !== undefined) updateData.port_of_discharge = updates.portOfDischarge;
      if (updates.departureDate !== undefined) updateData.departure_date = updates.departureDate;
      if (updates.arrivalDate !== undefined) updateData.arrival_date = updates.arrivalDate;
      if (updates.vesselName !== undefined) updateData.vessel_name = updates.vesselName;
      if (updates.containerNumber !== undefined) updateData.container_number = updates.containerNumber;
      if (updates.flightNumber !== undefined) updateData.flight_number = updates.flightNumber;
      if (updates.departureAirport !== undefined) updateData.departure_airport = updates.departureAirport;
      if (updates.arrivalAirport !== undefined) updateData.arrival_airport = updates.arrivalAirport;
      if (updates.departureTime !== undefined) updateData.departure_time = updates.departureTime;
      if (updates.arrivalTime !== undefined) updateData.arrival_time = updates.arrivalTime;
      if (updates.cargoBoxes !== undefined) updateData.cargo_boxes = JSON.stringify(updates.cargoBoxes);
      if (updates.pricePerCBM !== undefined) updateData.price_per_cbm = updates.pricePerCBM;
      
      // Calculate total CBM if cargo boxes are updated
      if (updates.cargoBoxes) {
        updateData.total_cbm = updates.cargoBoxes.reduce((total, box) => 
          total + ((box.length * box.width * box.height * box.quantity) / 1000000), 0
        );
      }

      const { data, error } = await supabase
        .from('lats_shipping_info')
        .update(updateData)
        .eq('id', shippingId)
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers!lats_shipping_info_manager_id_fkey(id, name, department, phone, email)
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
        method: data.shipping_method || 'Standard',
        shippingMethod: data.shipping_method || 'standard',
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
        portOfLoading: data.port_of_loading || '',
        portOfDischarge: data.port_of_discharge || '',
        pricePerCBM: data.price_per_cbm || 0,
        enableInsurance: data.enable_insurance || false,
        requireSignature: data.require_signature || false,
        status: data.status || 'pending',
        cargoBoxes: data.cargo_boxes ? JSON.parse(data.cargo_boxes) : [],
        cargoItems: [], // Will be populated separately
        trackingEvents: [],
        // Additional fields
        flightNumber: data.flight_number || '',
        departureAirport: data.departure_airport || '',
        arrivalAirport: data.arrival_airport || '',
        departureTime: data.departure_time || '',
        arrivalTime: data.arrival_time || '',
        vesselName: data.vessel_name || '',
        departureDate: data.departure_date || '',
        arrivalDate: data.arrival_date || '',
        containerNumber: data.container_number || ''
      };

      console.log('✅ [ShippingDataService] Successfully updated shipping info:', {
        id: shippingInfo.id,
        trackingNumber: shippingInfo.trackingNumber
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
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ [ShippingDataService] Error fetching shipping events:', error);
        throw error;
      }

      const events: ShippingEvent[] = data.map(event => ({
        id: event.id,
        status: event.status,
        description: event.description,
        location: event.location,
        timestamp: event.timestamp,
        notes: event.notes
      }));

      console.log('✅ [ShippingDataService] Found', events.length, 'shipping events');
      return events;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in getShippingEvents:', error);
      throw error;
    }
  }

  async addShippingEvent(shippingId: string, event: Omit<ShippingEvent, 'id'>): Promise<ShippingEvent> {
    try {
      console.log('🚚 [ShippingDataService] Adding shipping event for:', shippingId);
      
      const { data, error } = await supabase
        .from('lats_shipping_events')
        .insert({
          shipping_id: shippingId,
          status: event.status,
          description: event.description,
          location: event.location,
          timestamp: event.timestamp,
          notes: event.notes
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [ShippingDataService] Error adding shipping event:', error);
        throw error;
      }

      const shippingEvent: ShippingEvent = {
        id: data.id,
        status: data.status,
        description: data.description,
        location: data.location,
        timestamp: data.timestamp,
        notes: data.notes
      };

      console.log('✅ [ShippingDataService] Successfully added shipping event:', shippingEvent.id);
      return shippingEvent;
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
          agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `);

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

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ShippingDataService] Error fetching all shipping info:', error);
        throw error;
      }

      const shippingInfoList: ShippingInfo[] = data.map(item => ({
        id: item.id,
        carrier: item.carrier?.name || 'Unknown Carrier',
        carrierId: item.carrier_id,
        trackingNumber: item.tracking_number,
        method: item.shipping_method || 'Standard',
        shippingMethod: item.shipping_method || 'standard',
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
        portOfLoading: item.port_of_loading || '',
        portOfDischarge: item.port_of_discharge || '',
        pricePerCBM: item.price_per_cbm || 0,
        enableInsurance: item.enable_insurance || false,
        requireSignature: item.require_signature || false,
        status: item.status || 'pending',
        cargoBoxes: item.cargo_boxes ? JSON.parse(item.cargo_boxes) : [],
        cargoItems: [], // Will be populated separately
        trackingEvents: [],
        // Additional fields
        flightNumber: item.flight_number || '',
        departureAirport: item.departure_airport || '',
        arrivalAirport: item.arrival_airport || '',
        departureTime: item.departure_time || '',
        arrivalTime: item.arrival_time || '',
        vesselName: item.vessel_name || '',
        departureDate: item.departure_date || '',
        arrivalDate: item.arrival_date || '',
        containerNumber: item.container_number || ''
      }));

      console.log('✅ [ShippingDataService] Found', shippingInfoList.length, 'shipping info records');
      return shippingInfoList;
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in getAllShippingInfo:', error);
      throw error;
    }
  }

  async getShippingInfoByProductId(productId: string): Promise<ShippingInfo[]> {
    try {
      console.log('🚚 [ShippingDataService] Fetching shipping info for product:', productId);
      
      // First, find all purchase orders that contain this product
      const { data: purchaseOrders, error: poError } = await supabase
        .from('lats_purchase_order_items')
        .select('purchase_order_id')
        .eq('product_id', productId);

      if (poError) {
        console.error('🚚 [ShippingDataService] Error fetching purchase orders for product:', poError);
        throw poError;
      }

      if (!purchaseOrders || purchaseOrders.length === 0) {
        console.log('🚚 [ShippingDataService] No purchase orders found for product:', productId);
        return [];
      }

      // Extract unique purchase order IDs
      const purchaseOrderIds = [...new Set(purchaseOrders.map(po => po.purchase_order_id))];
      console.log('🚚 [ShippingDataService] Found purchase orders for product:', purchaseOrderIds);

      // Now fetch shipping info for these purchase orders
      const { data, error } = await supabase
        .from('lats_shipping_info')
        .select(`
          *,
          purchase_order:lats_purchase_orders(id, order_number, status, created_at)
        `)
        .in('purchase_order_id', purchaseOrderIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚚 [ShippingDataService] Error fetching shipping info for product:', error);
        throw error;
      }

      console.log('🚚 [ShippingDataService] Successfully fetched shipping info for product:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚚 [ShippingDataService] Error in getShippingInfoByProductId:', error);
      throw error;
    }
  }

  async updateShippingStatus(shippingId: string, statusUpdate: {
    status: string;
    location: string;
    notes: string;
    transitType?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    flightNumber?: string;
    vesselName?: string;
    departureLocation?: string;
    arrivalLocation?: string;
    estimatedArrival?: string;
    deliveryMethod?: string;
    recipientName?: string;
    recipientPhone?: string;
    exceptionType?: string;
    exceptionDescription?: string;
    resolutionPlan?: string;
    
    // Sea shipping specific fields (only essential tracking fields, agent handles operational details)
    containerNumber?: string;
    billOfLading?: string;
    
    // Air shipping specific fields
    selectedAgentId?: string;
    cargoType?: 'per_piece' | 'per_kg';
    itemDescription?: string;
    quantity?: number;
    receiptNumber?: string;
    extraTransportCost?: number;
    unitPrice?: number;
    totalCost?: number;
    
    // Ground shipping specific fields
    departureTerminal?: string;
    arrivalTerminal?: string;
    routeNumber?: string;
    
    // Package and cargo details
    packageCount?: number;
    totalCbm?: number;
    pricePerCbm?: number;
    totalCbmCost?: number;
    
    // Insurance and special handling
    requireSignature?: boolean;
    enableInsurance?: boolean;
    insuranceValue?: number;
    
    // Cost breakdown
    freightCost?: number;
    deliveryCost?: number;
    insuranceCost?: number;
    customsCost?: number;
    handlingCost?: number;
    totalShippingCost?: number;
    shippingCostCurrency?: string;
  }): Promise<{ shippingInfo: ShippingInfo; event: ShippingEvent }> {
    try {
      console.log('🚚 [ShippingDataService] Updating shipping status for:', shippingId);
      
      // Get current shipping info and events for validation
      const { data: currentShipping, error: currentError } = await supabase
        .from('lats_shipping_info')
        .select('status')
        .eq('id', shippingId)
        .single();

      if (currentError) {
        throw new Error(`Failed to get current shipping status: ${currentError.message}`);
      }

      const { data: events, error: eventsError } = await supabase
        .from('lats_shipping_events')
        .select('status')
        .eq('shipping_id', shippingId)
        .order('timestamp', { ascending: true });

      if (eventsError) {
        throw new Error(`Failed to get shipping events: ${eventsError.message}`);
      }

      // Validate status transition
      const currentStatus = currentShipping.status;
      const newStatus = statusUpdate.status;
      
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. Status must follow the step-by-step flow.`);
      }

      // Check if status has been used before (except for exception status)
      if (newStatus !== 'exception' && hasStatusBeenUsed(newStatus, events)) {
        throw new Error(`Status '${newStatus}' has already been used and cannot be set again.`);
      }
      
      // Update the main shipping info status
      const updateData: any = {
        status: statusUpdate.status,
        updated_at: new Date().toISOString()
      };

      // Add sea shipping specific fields (only essential tracking fields)
      if (statusUpdate.containerNumber !== undefined) updateData.container_number = statusUpdate.containerNumber;
      if (statusUpdate.billOfLading !== undefined) updateData.bill_of_lading = statusUpdate.billOfLading;
      
      // Add air shipping specific fields
      if (statusUpdate.selectedAgentId !== undefined) updateData.shipping_agent_id = statusUpdate.selectedAgentId;
      if (statusUpdate.cargoType !== undefined) updateData.cargo_type = statusUpdate.cargoType;
      if (statusUpdate.itemDescription !== undefined) updateData.item_description = statusUpdate.itemDescription;
      if (statusUpdate.quantity !== undefined) updateData.quantity = statusUpdate.quantity;
      if (statusUpdate.receiptNumber !== undefined) updateData.receipt_number = statusUpdate.receiptNumber;
      if (statusUpdate.extraTransportCost !== undefined) updateData.extra_transport_cost = statusUpdate.extraTransportCost;
      if (statusUpdate.unitPrice !== undefined) updateData.unit_price = statusUpdate.unitPrice;
      if (statusUpdate.totalCost !== undefined) updateData.total_cost = statusUpdate.totalCost;
      
      // Add ground shipping specific fields
      if (statusUpdate.departureTerminal !== undefined) updateData.departure_terminal = statusUpdate.departureTerminal;
      if (statusUpdate.arrivalTerminal !== undefined) updateData.arrival_terminal = statusUpdate.arrivalTerminal;
      if (statusUpdate.routeNumber !== undefined) updateData.route_number = statusUpdate.routeNumber;
      
      // Add package and cargo details
      if (statusUpdate.packageCount !== undefined) updateData.package_count = statusUpdate.packageCount;
      if (statusUpdate.totalCbm !== undefined) updateData.total_cbm = statusUpdate.totalCbm;
      if (statusUpdate.pricePerCbm !== undefined) updateData.price_per_cbm = statusUpdate.pricePerCbm;
      if (statusUpdate.totalCbmCost !== undefined) updateData.total_cbm_cost = statusUpdate.totalCbmCost;
      
      // Add insurance and special handling
      if (statusUpdate.requireSignature !== undefined) updateData.require_signature = statusUpdate.requireSignature;
      if (statusUpdate.enableInsurance !== undefined) updateData.enable_insurance = statusUpdate.enableInsurance;
      if (statusUpdate.insuranceValue !== undefined) updateData.insurance_value = statusUpdate.insuranceValue;
      
      // Add cost breakdown
      if (statusUpdate.freightCost !== undefined) updateData.freight_cost = statusUpdate.freightCost;
      if (statusUpdate.deliveryCost !== undefined) updateData.delivery_cost = statusUpdate.deliveryCost;
      if (statusUpdate.insuranceCost !== undefined) updateData.insurance_cost = statusUpdate.insuranceCost;
      if (statusUpdate.customsCost !== undefined) updateData.customs_cost = statusUpdate.customsCost;
      if (statusUpdate.handlingCost !== undefined) updateData.handling_cost = statusUpdate.handlingCost;
      if (statusUpdate.totalShippingCost !== undefined) updateData.total_shipping_cost = statusUpdate.totalShippingCost;
      if (statusUpdate.shippingCostCurrency !== undefined) updateData.shipping_cost_currency = statusUpdate.shippingCostCurrency;

      // Add special fields for new statuses
      if (statusUpdate.status === 'arrived') {
        updateData.products_updated_at = new Date().toISOString();
      } else if (statusUpdate.status === 'received') {
        updateData.inventory_received_at = new Date().toISOString();
      }

      const { data: shippingData, error: shippingError } = await supabase
        .from('lats_shipping_info')
        .update(updateData)
        .eq('id', shippingId)
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers!lats_shipping_info_manager_id_fkey(id, name, department, phone, email)
        `)
        .single();

      if (shippingError) {
        console.error('❌ [ShippingDataService] Error updating shipping status:', shippingError);
        throw shippingError;
      }

      // Create enhanced description with additional information
      const additionalInfo: string[] = [];

      if (statusUpdate.transitType) {
        additionalInfo.push(`Transit Type: ${statusUpdate.transitType}`);
      }
      if (statusUpdate.vehicleNumber) {
        additionalInfo.push(`Vehicle: ${statusUpdate.vehicleNumber}`);
      }
      if (statusUpdate.driverName) {
        additionalInfo.push(`Driver: ${statusUpdate.driverName}`);
      }
      if (statusUpdate.flightNumber) {
        additionalInfo.push(`Flight: ${statusUpdate.flightNumber}`);
      }
      if (statusUpdate.vesselName) {
        additionalInfo.push(`Vessel: ${statusUpdate.vesselName}`);
      }
      if (statusUpdate.departureLocation) {
        additionalInfo.push(`From: ${statusUpdate.departureLocation}`);
      }
      if (statusUpdate.arrivalLocation) {
        additionalInfo.push(`To: ${statusUpdate.arrivalLocation}`);
      }
      if (statusUpdate.estimatedArrival) {
        additionalInfo.push(`ETA: ${new Date(statusUpdate.estimatedArrival).toLocaleString()}`);
      }
      if (statusUpdate.deliveryMethod) {
        additionalInfo.push(`Delivery: ${statusUpdate.deliveryMethod.replace('_', ' ')}`);
      }
      if (statusUpdate.recipientName) {
        additionalInfo.push(`Recipient: ${statusUpdate.recipientName}`);
      }
      if (statusUpdate.exceptionType) {
        additionalInfo.push(`Exception: ${statusUpdate.exceptionType}`);
      }

      // Create description from status and additional info
      let enhancedDescription = statusUpdate.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (additionalInfo.length > 0) {
        enhancedDescription += ` (${additionalInfo.join(', ')})`;
      }

      // Create enhanced notes with all additional information
      let enhancedNotes = statusUpdate.notes || '';
      const noteSections: string[] = [];

      if (statusUpdate.transitType) {
        noteSections.push(`Transit Type: ${statusUpdate.transitType}`);
      }
      if (statusUpdate.vehicleNumber) {
        noteSections.push(`Vehicle Number: ${statusUpdate.vehicleNumber}`);
      }
      if (statusUpdate.driverName) {
        noteSections.push(`Driver Name: ${statusUpdate.driverName}`);
      }
      if (statusUpdate.driverPhone) {
        noteSections.push(`Driver Phone: ${statusUpdate.driverPhone}`);
      }
      if (statusUpdate.flightNumber) {
        noteSections.push(`Flight Number: ${statusUpdate.flightNumber}`);
      }
      if (statusUpdate.vesselName) {
        noteSections.push(`Vessel Name: ${statusUpdate.vesselName}`);
      }
      if (statusUpdate.departureLocation) {
        noteSections.push(`Departure: ${statusUpdate.departureLocation}`);
      }
      if (statusUpdate.arrivalLocation) {
        noteSections.push(`Arrival: ${statusUpdate.arrivalLocation}`);
      }
      if (statusUpdate.estimatedArrival) {
        noteSections.push(`Estimated Arrival: ${new Date(statusUpdate.estimatedArrival).toLocaleString()}`);
      }
      if (statusUpdate.deliveryMethod) {
        noteSections.push(`Delivery Method: ${statusUpdate.deliveryMethod.replace('_', ' ')}`);
      }
      if (statusUpdate.recipientName) {
        noteSections.push(`Recipient Name: ${statusUpdate.recipientName}`);
      }
      if (statusUpdate.recipientPhone) {
        noteSections.push(`Recipient Phone: ${statusUpdate.recipientPhone}`);
      }
      if (statusUpdate.exceptionType) {
        noteSections.push(`Exception Type: ${statusUpdate.exceptionType}`);
      }
      if (statusUpdate.exceptionDescription) {
        noteSections.push(`Exception Description: ${statusUpdate.exceptionDescription}`);
      }
      if (statusUpdate.resolutionPlan) {
        noteSections.push(`Resolution Plan: ${statusUpdate.resolutionPlan}`);
      }
      
      // Add sea shipping specific fields to notes (only essential tracking fields)
      if (statusUpdate.containerNumber) {
        noteSections.push(`Container Number: ${statusUpdate.containerNumber}`);
      }
      if (statusUpdate.billOfLading) {
        noteSections.push(`Bill of Lading: ${statusUpdate.billOfLading}`);
      }
      
      // Add air shipping specific fields to notes
      if (statusUpdate.selectedAgentId) {
        noteSections.push(`Selected Agent ID: ${statusUpdate.selectedAgentId}`);
      }
      if (statusUpdate.cargoType) {
        noteSections.push(`Cargo Type: ${statusUpdate.cargoType}`);
      }
      if (statusUpdate.itemDescription) {
        noteSections.push(`Item Description: ${statusUpdate.itemDescription}`);
      }
      if (statusUpdate.quantity) {
        noteSections.push(`Quantity: ${statusUpdate.quantity}`);
      }
      if (statusUpdate.receiptNumber) {
        noteSections.push(`Receipt Number: ${statusUpdate.receiptNumber}`);
      }
      if (statusUpdate.extraTransportCost) {
        noteSections.push(`Extra Transport Cost: $${statusUpdate.extraTransportCost}`);
      }
      if (statusUpdate.unitPrice) {
        noteSections.push(`Unit Price: $${statusUpdate.unitPrice}`);
      }
      if (statusUpdate.totalCost) {
        noteSections.push(`Total Cost: $${statusUpdate.totalCost}`);
      }
      
      // Add ground shipping specific fields to notes
      if (statusUpdate.departureTerminal) {
        noteSections.push(`Departure Terminal: ${statusUpdate.departureTerminal}`);
      }
      if (statusUpdate.arrivalTerminal) {
        noteSections.push(`Arrival Terminal: ${statusUpdate.arrivalTerminal}`);
      }
      if (statusUpdate.routeNumber) {
        noteSections.push(`Route Number: ${statusUpdate.routeNumber}`);
      }
      if (statusUpdate.packageCount) {
        noteSections.push(`Package Count: ${statusUpdate.packageCount}`);
      }
      if (statusUpdate.totalCbm) {
        noteSections.push(`Total CBM: ${statusUpdate.totalCbm} m³`);
      }
      if (statusUpdate.pricePerCbm) {
        noteSections.push(`Price per CBM: ${statusUpdate.pricePerCbm}`);
      }
      if (statusUpdate.totalCbmCost) {
        noteSections.push(`Total CBM Cost: ${statusUpdate.totalCbmCost}`);
      }
      if (statusUpdate.requireSignature) {
        noteSections.push(`Require Signature: Yes`);
      }
      if (statusUpdate.enableInsurance) {
        noteSections.push(`Package Insurance: Yes`);
      }
      if (statusUpdate.insuranceValue) {
        noteSections.push(`Insurance Value: ${statusUpdate.insuranceValue}`);
      }
      if (statusUpdate.freightCost) {
        noteSections.push(`Freight Cost: ${statusUpdate.freightCost}`);
      }
      if (statusUpdate.deliveryCost) {
        noteSections.push(`Delivery Cost: ${statusUpdate.deliveryCost}`);
      }
      if (statusUpdate.insuranceCost) {
        noteSections.push(`Insurance Cost: ${statusUpdate.insuranceCost}`);
      }
      if (statusUpdate.customsCost) {
        noteSections.push(`Customs Cost: ${statusUpdate.customsCost}`);
      }
      if (statusUpdate.handlingCost) {
        noteSections.push(`Handling Cost: ${statusUpdate.handlingCost}`);
      }
      if (statusUpdate.totalShippingCost) {
        noteSections.push(`Total Shipping Cost: ${statusUpdate.totalShippingCost} ${statusUpdate.shippingCostCurrency || 'TZS'}`);
      }

      if (noteSections.length > 0) {
        enhancedNotes = noteSections.join('\n') + (enhancedNotes ? '\n\nAdditional Notes:\n' + enhancedNotes : '');
      }

      // Add the shipping event
      const event = await this.addShippingEvent(shippingId, {
        status: statusUpdate.status,
        description: enhancedDescription,
        location: statusUpdate.location,
        timestamp: new Date().toISOString(),
        notes: enhancedNotes
      });

      // Transform shipping data to ShippingInfo format
      const shippingInfo: ShippingInfo = {
        id: shippingData.id,
        carrier: shippingData.carrier?.name || 'Unknown Carrier',
        carrierId: shippingData.carrier_id,
        trackingNumber: shippingData.tracking_number,
        method: shippingData.shipping_method || 'Standard',
        shippingMethod: shippingData.shipping_method || 'standard',
        cost: shippingData.cost || 0,
        notes: shippingData.notes || '',
        agentId: shippingData.agent_id || '',
        agent: shippingData.agent ? {
          id: shippingData.agent.id,
          name: shippingData.agent.name,
          company: shippingData.agent.company,
          phone: shippingData.agent.phone,
          email: shippingData.agent.email,
          isActive: shippingData.agent.is_active
        } : null,
        managerId: shippingData.manager_id || '',
        manager: shippingData.manager ? {
          id: shippingData.manager.id,
          name: shippingData.manager.name,
          department: shippingData.manager.department,
          phone: shippingData.manager.phone,
          email: shippingData.manager.email
        } : null,
        estimatedDelivery: shippingData.estimated_delivery || '',
        shippedDate: '',
        deliveredDate: shippingData.actual_delivery || '',
        portOfLoading: shippingData.port_of_loading || '',
        portOfDischarge: shippingData.port_of_discharge || '',
        pricePerCBM: shippingData.price_per_cbm || 0,
        enableInsurance: shippingData.enable_insurance || false,
        requireSignature: shippingData.require_signature || false,
        status: shippingData.status || 'pending',
        cargoBoxes: shippingData.cargo_boxes ? JSON.parse(shippingData.cargo_boxes) : [],
        cargoItems: [], // Will be populated separately
        trackingEvents: [],
        // Additional fields
        flightNumber: shippingData.flight_number || '',
        departureAirport: shippingData.departure_airport || '',
        arrivalAirport: shippingData.arrival_airport || '',
        departureTime: shippingData.departure_time || '',
        arrivalTime: shippingData.arrival_time || '',
        vesselName: shippingData.vessel_name || '',
        departureDate: shippingData.departure_date || '',
        arrivalDate: shippingData.arrival_date || '',
        containerNumber: shippingData.container_number || '',
        // Additional tracking fields
        shippingOrigin: shippingData.shipping_origin || '',
        shippingDestination: shippingData.shipping_destination || '',
        totalCBM: shippingData.total_cbm || 0,
        // New workflow fields
        productsUpdatedAt: shippingData.products_updated_at || '',
        inventoryReceivedAt: shippingData.inventory_received_at || ''
      };

      console.log('✅ [ShippingDataService] Successfully updated shipping status:', statusUpdate.status);
      return { shippingInfo, event };
    } catch (error) {
      console.error('❌ [ShippingDataService] Error in updateShippingStatus:', error);
      throw error;
    }
  }

  /**
   * Get cargo items (draft products) for a shipment
   */
  async getShippingCargoItems(shippingId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lats_shipping_cargo_items')
        .select(`
          *,
          product:lats_products(
            *,
            category:lats_categories(*),
            supplier:lats_suppliers(*),
            variants:lats_product_variants(*)
          ),
          purchase_order_item:lats_purchase_order_items(*)
        `)
        .eq('shipping_id', shippingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [ShippingDataService] Error fetching cargo items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [ShippingDataService] Unexpected error fetching cargo items:', error);
      return [];
    }
  }

  private generateUniqueTrackingNumber(carrierId?: string): string {
    // Generate a unique tracking number with timestamp and random component
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const carrierPrefix = carrierId ? carrierId.substring(0, 3).toUpperCase() : 'TRK';
    
    return `${carrierPrefix}${timestamp}${random}`;
  }
}

// Export singleton instance
export const shippingDataService = new ShippingDataServiceImpl();
