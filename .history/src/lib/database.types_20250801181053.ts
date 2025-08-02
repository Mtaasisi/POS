export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      auth_users: {
        Row: {
          id: string
          email: string
          username: string
          name: string
          role: 'admin' | 'customer-care' | 'technician'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          name: string
          role: 'admin' | 'customer-care' | 'technician'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          name?: string
          role?: 'admin' | 'customer-care' | 'technician'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          gender: 'male' | 'female' | 'other' | null
          city: string | null
          location_description: string | null
          national_id: string | null
          joined_date: string
          loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum'
          color_tag: 'new' | 'vip' | 'complainer' | 'purchased'
          referred_by: string | null
          total_spent: number
          points: number
          last_visit: string
          is_active: boolean
          whatsapp: string | null
          referral_source: string | null
          birth_month: string | null
          birth_day: string | null
          total_returns: number
          profile_image: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          phone: string
          gender?: 'male' | 'female' | 'other' | null
          city?: string | null
          location_description?: string | null
          national_id?: string | null
          joined_date?: string
          loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum'
          color_tag?: 'new' | 'vip' | 'complainer' | 'purchased'
          referred_by?: string | null
          total_spent?: number
          points?: number
          last_visit?: string
          is_active?: boolean
          whatsapp?: string | null
          referral_source?: string | null
          birth_month?: string | null
          birth_day?: string | null
          total_returns?: number
          profile_image?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          gender?: 'male' | 'female' | 'other' | null
          city?: string | null
          location_description?: string | null
          national_id?: string | null
          joined_date?: string
          loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum'
          color_tag?: 'new' | 'vip' | 'complainer' | 'purchased'
          referred_by?: string | null
          total_spent?: number
          points?: number
          last_visit?: string
          is_active?: boolean
          whatsapp?: string | null
          referral_source?: string | null
          birth_month?: string | null
          birth_day?: string | null
          total_returns?: number
          profile_image?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      devices: {
        Row: {
          id: string
          customer_id: string
          brand: string
          model: string
          serial_number: string | null
          issue_description: string
          status: 'assigned' | 'diagnosis-started' | 'awaiting-parts' | 'in-repair' | 'reassembled-testing' | 'repair-complete' | 'returned-to-customer-care' | 'done' | 'failed'
          assigned_to: string | null
          estimated_hours: number | null
          expected_return_date: string
          warranty_start: string | null
          warranty_end: string | null
          warranty_status: string | null
          repair_count: number
          last_return_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          customer_id: string
          brand: string
          model: string
          serial_number?: string | null
          issue_description: string
          status?: 'assigned' | 'diagnosis-started' | 'awaiting-parts' | 'in-repair' | 'reassembled-testing' | 'repair-complete' | 'returned-to-customer-care' | 'done' | 'failed'
          assigned_to?: string | null
          estimated_hours?: number | null
          expected_return_date: string
          warranty_start?: string | null
          warranty_end?: string | null
          warranty_status?: string | null
          repair_count?: number
          last_return_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          brand?: string
          model?: string
          serial_number?: string | null
          issue_description?: string
          status?: 'assigned' | 'diagnosis-started' | 'awaiting-parts' | 'in-repair' | 'reassembled-testing' | 'repair-complete' | 'returned-to-customer-care' | 'done' | 'failed'
          assigned_to?: string | null
          estimated_hours?: number | null
          expected_return_date?: string
          warranty_start?: string | null
          warranty_end?: string | null
          warranty_status?: string | null
          repair_count?: number
          last_return_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      device_checklists: {
        Row: {
          id: string
          device_id: string
          checklist_type: string
          items: any[]
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          checklist_type: string
          items?: any[]
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          checklist_type?: string
          items?: any[]
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      device_remarks: {
        Row: {
          id: string
          device_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id: string
          device_id: string
          content: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          content?: string
          created_by?: string
          created_at?: string
        }
      }
      device_transitions: {
        Row: {
          id: string
          device_id: string
          from_status: string
          to_status: string
          performed_by: string
          signature: string | null
          created_at: string
        }
        Insert: {
          id: string
          device_id: string
          from_status: string
          to_status: string
          performed_by: string
          signature?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          from_status?: string
          to_status?: string
          performed_by?: string
          signature?: string | null
          created_at?: string
        }
      }
      device_ratings: {
        Row: {
          id: string
          device_id: string
          technician_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id: string
          device_id: string
          technician_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          technician_id?: string
          score?: number
          comment?: string | null
          created_at?: string
        }
      }
      customer_notes: {
        Row: {
          id: string
          customer_id: string
          content: string
          created_by: string
          created_at: string
        }
        Insert: {
          id: string
          customer_id: string
          content: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          content?: string
          created_by?: string
          created_at?: string
        }
      }
      promo_messages: {
        Row: {
          id: string
          customer_id: string
          title: string
          content: string
          sent_via: 'sms' | 'whatsapp' | 'email'
          sent_at: string
          status: 'sent' | 'delivered' | 'failed'
        }
        Insert: {
          id: string
          customer_id: string
          title: string
          content: string
          sent_via: 'sms' | 'whatsapp' | 'email'
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          content?: string
          sent_via?: 'sms' | 'whatsapp' | 'email'
          sent_at?: string
          status?: 'sent' | 'delivered' | 'failed'
        }
      }
      customer_payments: {
        Row: {
          id: string
          customer_id: string
          amount: number
          method: 'cash' | 'card' | 'transfer'
          device_id: string | null
          payment_date: string
          payment_type: 'payment' | 'deposit' | 'refund'
          status: 'completed' | 'pending' | 'failed'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id: string
          customer_id: string
          amount: number
          method: 'cash' | 'card' | 'transfer'
          device_id?: string | null
          payment_date?: string
          payment_type: 'payment' | 'deposit' | 'refund'
          status?: 'completed' | 'pending' | 'failed'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          amount?: number
          method?: 'cash' | 'card' | 'transfer'
          device_id?: string | null
          payment_date?: string
          payment_type?: 'payment' | 'deposit' | 'refund'
          status?: 'completed' | 'pending' | 'failed'
          created_by?: string | null
          created_at?: string
        }
      }
      sms_campaigns: {
        Row: {
          id: string
          message_content: string
          total_recipients: number
          successful_sends: number
          failed_sends: number
          sent_by: string
          campaign_type: string
          status: 'pending' | 'completed' | 'partial' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_content: string
          total_recipients?: number
          successful_sends?: number
          failed_sends?: number
          sent_by: string
          campaign_type?: string
          status?: 'pending' | 'completed' | 'partial' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_content?: string
          total_recipients?: number
          successful_sends?: number
          failed_sends?: number
          sent_by?: string
          campaign_type?: string
          status?: 'pending' | 'completed' | 'partial' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      returns: {
        Row: {
          id: string
          device_id: string | null
          manual_device_brand: string | null
          manual_device_model: string | null
          manual_device_serial: string | null
          customer_id: string
          reason: string
          intake_checklist: Json | null
          status: 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged'
          attachments: Json | null
          resolution: string | null
          staff_signature: string | null
          customer_signature: string | null
          created_at: string
          updated_at: string
          purchase_date: string | null
          return_type: 'refund' | 'exchange' | 'store-credit' | null
          branch: string | null
          staff_name: string | null
          contact_confirmed: boolean
          accessories: Json | null
          condition_description: string | null
          customer_reported_issue: string | null
          staff_observed_issue: string | null
          customer_satisfaction: number | null
          preferred_contact: string | null
          return_auth_number: string | null
          return_method: string | null
          return_shipping_fee: string | null
          expected_pickup_date: string | null
          geo_location: Json | null
          policy_acknowledged: boolean
          device_locked: string | null
          privacy_wiped: boolean
          internal_notes: string | null
          escalation_required: boolean
          additional_docs: Json | null
          refund_amount: number | null
          exchange_device_id: string | null
          restocking_fee: number | null
          refund_method: 'cash' | 'card' | 'transfer' | 'store-credit' | null
          user_ip: string | null
          user_location: string | null
        }
        Insert: {
          id?: string
          device_id?: string | null
          manual_device_brand?: string | null
          manual_device_model?: string | null
          manual_device_serial?: string | null
          customer_id: string
          reason: string
          intake_checklist?: Json | null
          status?: 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged'
          attachments?: Json | null
          resolution?: string | null
          staff_signature?: string | null
          customer_signature?: string | null
          created_at?: string
          updated_at?: string
          purchase_date?: string | null
          return_type?: 'refund' | 'exchange' | 'store-credit' | null
          branch?: string | null
          staff_name?: string | null
          contact_confirmed?: boolean
          accessories?: Json | null
          condition_description?: string | null
          customer_reported_issue?: string | null
          staff_observed_issue?: string | null
          customer_satisfaction?: number | null
          preferred_contact?: string | null
          return_auth_number?: string | null
          return_method?: string | null
          return_shipping_fee?: string | null
          expected_pickup_date?: string | null
          geo_location?: Json | null
          policy_acknowledged?: boolean
          device_locked?: string | null
          privacy_wiped?: boolean
          internal_notes?: string | null
          escalation_required?: boolean
          additional_docs?: Json | null
          refund_amount?: number | null
          exchange_device_id?: string | null
          restocking_fee?: number | null
          refund_method?: 'cash' | 'card' | 'transfer' | 'store-credit' | null
          user_ip?: string | null
          user_location?: string | null
        }
        Update: {
          id?: string
          device_id?: string | null
          manual_device_brand?: string | null
          manual_device_model?: string | null
          manual_device_serial?: string | null
          customer_id?: string
          reason?: string
          intake_checklist?: Json | null
          status?: 'under-return-review' | 'return-accepted' | 'return-rejected' | 'return-resolved' | 'return-refunded' | 'return-exchanged'
          attachments?: Json | null
          resolution?: string | null
          staff_signature?: string | null
          customer_signature?: string | null
          created_at?: string
          updated_at?: string
          purchase_date?: string | null
          return_type?: 'refund' | 'exchange' | 'store-credit' | null
          branch?: string | null
          staff_name?: string | null
          contact_confirmed?: boolean
          accessories?: Json | null
          condition_description?: string | null
          customer_reported_issue?: string | null
          staff_observed_issue?: string | null
          customer_satisfaction?: number | null
          preferred_contact?: string | null
          return_auth_number?: string | null
          return_method?: string | null
          return_shipping_fee?: string | null
          expected_pickup_date?: string | null
          geo_location?: Json | null
          policy_acknowledged?: boolean
          device_locked?: string | null
          privacy_wiped?: boolean
          internal_notes?: string | null
          escalation_required?: boolean
          additional_docs?: Json | null
          refund_amount?: number | null
          exchange_device_id?: string | null
          restocking_fee?: number | null
          refund_method?: 'cash' | 'card' | 'transfer' | 'store-credit' | null
          user_ip?: string | null
          user_location?: string | null
        }
      }
      return_remarks: {
        Row: {
          id: string
          return_id: string
          content: string
          created_by: string
          created_at: string
          type: 'staff' | 'customer' | 'system'
        }
        Insert: {
          id?: string
          return_id: string
          content: string
          created_by: string
          created_at?: string
          type?: 'staff' | 'customer' | 'system'
        }
        Update: {
          id?: string
          return_id?: string
          content?: string
          created_by?: string
          created_at?: string
          type?: 'staff' | 'customer' | 'system'
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          entity_type: 'device' | 'customer' | 'return' | 'user' | 'system'
          entity_id: string
          user_id: string
          user_role: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          action: string
          entity_type: 'device' | 'customer' | 'return' | 'user' | 'system'
          entity_id: string
          user_id: string
          user_role: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          action?: string
          entity_type?: 'device' | 'customer' | 'return' | 'user' | 'system'
          entity_id?: string
          user_id?: string
          user_role?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
      }
      points_transactions: {
        Row: {
          id: string
          customer_id: string
          points_change: number
          transaction_type: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired'
          reason: string
          device_id: string | null
          created_by: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          customer_id: string
          points_change: number
          transaction_type: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired'
          reason: string
          device_id?: string | null
          created_by: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          customer_id?: string
          points_change?: number
          transaction_type?: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired'
          reason?: string
          device_id?: string | null
          created_by?: string
          created_at?: string
          metadata?: Json | null
        }
      }
      redemption_rewards: {
        Row: {
          id: string
          name: string
          description: string
          points_cost: number
          discount_amount: number | null
          discount_type: 'percentage' | 'fixed' | 'free'
          category: 'repair' | 'diagnostic' | 'accessory' | 'service'
          is_active: boolean
          min_loyalty_level: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          max_uses: number | null
          valid_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          points_cost: number
          discount_amount?: number | null
          discount_type: 'percentage' | 'fixed' | 'free'
          category: 'repair' | 'diagnostic' | 'accessory' | 'service'
          is_active?: boolean
          min_loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          max_uses?: number | null
          valid_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          points_cost?: number
          discount_amount?: number | null
          discount_type?: 'percentage' | 'fixed' | 'free'
          category?: 'repair' | 'diagnostic' | 'accessory' | 'service'
          is_active?: boolean
          min_loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | null
          max_uses?: number | null
          valid_until?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      redemption_transactions: {
        Row: {
          id: string
          customer_id: string
          reward_id: string
          points_spent: number
          discount_amount: number
          discount_type: 'percentage' | 'fixed' | 'free'
          redeemed_at: string
          status: 'active' | 'used' | 'expired'
          used_at: string | null
          device_id: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          reward_id: string
          points_spent: number
          discount_amount: number
          discount_type: 'percentage' | 'fixed' | 'free'
          redeemed_at?: string
          status?: 'active' | 'used' | 'expired'
          used_at?: string | null
          device_id?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          reward_id?: string
          points_spent?: number
          discount_amount?: number
          discount_type?: 'percentage' | 'fixed' | 'free'
          redeemed_at?: string
          status?: 'active' | 'used' | 'expired'
          used_at?: string | null
          device_id?: string | null
        }
      }
      spare_parts: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other'
          brand: string | null
          model_compatibility: string[] | null
          price: number
          cost: number
          stock_quantity: number
          min_stock_level: number
          supplier: string | null
          part_number: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other'
          brand?: string | null
          model_compatibility?: string[] | null
          price?: number
          cost?: number
          stock_quantity?: number
          min_stock_level?: number
          supplier?: string | null
          part_number?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other'
          brand?: string | null
          model_compatibility?: string[] | null
          price?: number
          cost?: number
          stock_quantity?: number
          min_stock_level?: number
          supplier?: string | null
          part_number?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      spare_parts_usage: {
        Row: {
          id: string
          spare_part_id: string
          device_id: string | null
          quantity_used: number
          used_by: string
          used_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          spare_part_id: string
          device_id?: string | null
          quantity_used: number
          used_by: string
          used_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          spare_part_id?: string
          device_id?: string | null
          quantity_used?: number
          used_by?: string
          used_at?: string
          notes?: string | null
        }
      }
    }
  }
}