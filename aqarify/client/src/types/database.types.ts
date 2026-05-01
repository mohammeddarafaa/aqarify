export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          number: string | null
          project_id: string
          tenant_id: string
          total_floors: number | null
          total_units: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          number?: string | null
          project_id: string
          tenant_id: string
          total_floors?: number | null
          total_units?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          number?: string | null
          project_id?: string
          tenant_id?: string
          total_floors?: number | null
          total_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_locks: {
        Row: {
          job_name: string
          locked_by: string | null
          locked_until: string
          updated_at: string
        }
        Insert: {
          job_name: string
          locked_by?: string | null
          locked_until: string
          updated_at?: string
        }
        Update: {
          job_name?: string
          locked_by?: string | null
          locked_until?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          reservation_id: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          reservation_id?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["document_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          reservation_id?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["document_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          aggregate_id?: string | null
          aggregate_type?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          aggregate_id?: string | null
          aggregate_type?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          outcome: string | null
          potential_customer_id: string | null
          scheduled_at: string
          status: string
          tenant_id: string
          type: Database["public"]["Enums"]["followup_type"]
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          potential_customer_id?: string | null
          scheduled_at: string
          status?: string
          tenant_id: string
          type?: Database["public"]["Enums"]["followup_type"]
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          potential_customer_id?: string | null
          scheduled_at?: string
          status?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["followup_type"]
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_potential_customer_id_fkey"
            columns: ["potential_customer_id"]
            isOneToOne: false
            referencedRelation: "potential_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          counter_price: number | null
          created_at: string
          created_by: string
          discount_pct: number | null
          id: string
          offered_price: number
          potential_customer_id: string
          special_terms: string | null
          status: Database["public"]["Enums"]["offer_status"]
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          counter_price?: number | null
          created_at?: string
          created_by: string
          discount_pct?: number | null
          id?: string
          offered_price: number
          potential_customer_id: string
          special_terms?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          counter_price?: number | null
          created_at?: string
          created_by?: string
          discount_pct?: number | null
          id?: string
          offered_price?: number
          potential_customer_id?: string
          special_terms?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_potential_customer_id_fkey"
            columns: ["potential_customer_id"]
            isOneToOne: false
            referencedRelation: "potential_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          message: string
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          due_date: string
          id: string
          paid_at: string | null
          paymob_transaction_id: string | null
          receipt_url: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          paid_at?: string | null
          paymob_transaction_id?: string | null
          receipt_url?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          paymob_transaction_id?: string | null
          receipt_url?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_payments: {
        Row: {
          amount_egp: number
          created_at: string
          currency: string
          hmac_verified_at: string | null
          id: string
          paid_at: string | null
          paymob_order_id: string | null
          paymob_transaction_id: string | null
          raw_webhook: Json | null
          status: Database["public"]["Enums"]["platform_payment_status"]
          tenant_id: string
          tenant_subscription_id: string
        }
        Insert: {
          amount_egp: number
          created_at?: string
          currency?: string
          hmac_verified_at?: string | null
          id?: string
          paid_at?: string | null
          paymob_order_id?: string | null
          paymob_transaction_id?: string | null
          raw_webhook?: Json | null
          status?: Database["public"]["Enums"]["platform_payment_status"]
          tenant_id: string
          tenant_subscription_id: string
        }
        Update: {
          amount_egp?: number
          created_at?: string
          currency?: string
          hmac_verified_at?: string | null
          id?: string
          paid_at?: string | null
          paymob_order_id?: string | null
          paymob_transaction_id?: string | null
          raw_webhook?: Json | null
          status?: Database["public"]["Enums"]["platform_payment_status"]
          tenant_id?: string
          tenant_subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_tenant_subscription_id_fkey"
            columns: ["tenant_subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_customers: {
        Row: {
          assigned_agent_id: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          interested_unit_types: Json | null
          last_contact_at: string | null
          name: string
          negotiation_status: Database["public"]["Enums"]["negotiation_status"]
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          preferred_locations: Json | null
          source: Database["public"]["Enums"]["lead_source"]
          source_reservation_id: string | null
          source_waitlist_id: string | null
          tenant_id: string
        }
        Insert: {
          assigned_agent_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          interested_unit_types?: Json | null
          last_contact_at?: string | null
          name: string
          negotiation_status?: Database["public"]["Enums"]["negotiation_status"]
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: Json | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_reservation_id?: string | null
          source_waitlist_id?: string | null
          tenant_id: string
        }
        Update: {
          assigned_agent_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          interested_unit_types?: Json | null
          last_contact_at?: string | null
          name?: string
          negotiation_status?: Database["public"]["Enums"]["negotiation_status"]
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_locations?: Json | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_reservation_id?: string | null
          source_waitlist_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_customers_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_customers_source_reservation_id_fkey"
            columns: ["source_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_customers_source_waitlist_id_fkey"
            columns: ["source_waitlist_id"]
            isOneToOne: false
            referencedRelation: "waiting_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potential_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          amenities: Json | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          gallery: Json | null
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          status: string
          tenant_id: string
          total_units: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          status?: string
          tenant_id: string
          total_units?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: Json | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          status?: string
          tenant_id?: string
          total_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          agent_id: string | null
          cancelled_at: string | null
          confirmation_number: string
          confirmed_at: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          payment_method: string | null
          paymob_transaction_id: string | null
          receipt_url: string | null
          reservation_fee_paid: number
          status: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_price: number
          unit_id: string
        }
        Insert: {
          agent_id?: string | null
          cancelled_at?: string | null
          confirmation_number: string
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          paymob_transaction_id?: string | null
          receipt_url?: string | null
          reservation_fee_paid?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          total_price: number
          unit_id: string
        }
        Update: {
          agent_id?: string | null
          cancelled_at?: string | null
          confirmation_number?: string
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          paymob_transaction_id?: string | null
          receipt_url?: string | null
          reservation_fee_paid?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string
          total_price?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: Database["public"]["Enums"]["plan_tier"]
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_projects: number
          max_units: number
          max_users: number
          name: string
          price_egp_monthly: number
          price_egp_yearly: number
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["plan_tier"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_projects: number
          max_units: number
          max_users: number
          name: string
          price_egp_monthly: number
          price_egp_yearly: number
          sort_order?: number
        }
        Update: {
          code?: Database["public"]["Enums"]["plan_tier"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_projects?: number
          max_units?: number
          max_users?: number
          name?: string
          price_egp_monthly?: number
          price_egp_yearly?: number
          sort_order?: number
        }
        Relationships: []
      }
      tenant_plugins: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          plugin_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          plugin_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          plugin_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_plugins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          amount_egp: number
          billing_currency: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paymob_order_id: string | null
          paymob_payment_key: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_egp: number
          billing_currency?: string
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paymob_order_id?: string | null
          paymob_payment_key?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_egp?: number
          billing_currency?: string
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paymob_order_id?: string | null
          paymob_payment_key?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          contact_email: string | null
          contact_phone: string | null
          country_code: string
          created_at: string
          currency: string
          currency_symbol: string
          custom_domain: string | null
          default_locale: string
          default_timezone: string
          email_from_address: string | null
          email_from_name: string | null
          enabled_features: Json
          fallback_currency: string
          favicon_url: string | null
          filter_schema: Json
          id: string
          logo_url: string | null
          map_center_lat: number | null
          map_center_lng: number | null
          map_zoom: number
          name: string
          notification_templates: Json
          payment_gateway: string
          paymob_api_key_enc: string | null
          paymob_hmac_secret_enc: string | null
          paymob_iframe_id: string | null
          paymob_integration_id: string | null
          receipt_footer_text: string | null
          receipt_primary_color: string | null
          slug: string
          sms_sender_name: string | null
          social_links: Json | null
          status: Database["public"]["Enums"]["tenant_status"]
          theme_config: Json
          ui_config: Json
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          custom_domain?: string | null
          default_locale?: string
          default_timezone?: string
          email_from_address?: string | null
          email_from_name?: string | null
          enabled_features?: Json
          fallback_currency?: string
          favicon_url?: string | null
          filter_schema?: Json
          id?: string
          logo_url?: string | null
          map_center_lat?: number | null
          map_center_lng?: number | null
          map_zoom?: number
          name: string
          notification_templates?: Json
          payment_gateway?: string
          paymob_api_key_enc?: string | null
          paymob_hmac_secret_enc?: string | null
          paymob_iframe_id?: string | null
          paymob_integration_id?: string | null
          receipt_footer_text?: string | null
          receipt_primary_color?: string | null
          slug: string
          sms_sender_name?: string | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          theme_config?: Json
          ui_config?: Json
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          custom_domain?: string | null
          default_locale?: string
          default_timezone?: string
          email_from_address?: string | null
          email_from_name?: string | null
          enabled_features?: Json
          fallback_currency?: string
          favicon_url?: string | null
          filter_schema?: Json
          id?: string
          logo_url?: string | null
          map_center_lat?: number | null
          map_center_lng?: number | null
          map_zoom?: number
          name?: string
          notification_templates?: Json
          payment_gateway?: string
          paymob_api_key_enc?: string | null
          paymob_hmac_secret_enc?: string | null
          paymob_iframe_id?: string | null
          paymob_integration_id?: string | null
          receipt_footer_text?: string | null
          receipt_primary_color?: string | null
          slug?: string
          sms_sender_name?: string | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["tenant_status"]
          theme_config?: Json
          ui_config?: Json
        }
        Relationships: []
      }
      units: {
        Row: {
          balconies: number
          bathrooms: number
          bedrooms: number
          building_id: string
          created_at: string
          custom_attributes: Json | null
          down_payment_pct: number
          finishing: string | null
          floor: number
          floor_plan_url: string | null
          gallery: Json | null
          garden_size: number | null
          has_garden: boolean
          id: string
          installment_months: number
          location_lat: number | null
          location_lng: number | null
          price: number
          project_id: string
          reservation_fee: number
          size_sqm: number
          status: Database["public"]["Enums"]["unit_status"]
          tenant_id: string
          type: string
          unit_number: string
          view_type: string | null
          virtual_tour_url: string | null
        }
        Insert: {
          balconies?: number
          bathrooms?: number
          bedrooms?: number
          building_id: string
          created_at?: string
          custom_attributes?: Json | null
          down_payment_pct?: number
          finishing?: string | null
          floor?: number
          floor_plan_url?: string | null
          gallery?: Json | null
          garden_size?: number | null
          has_garden?: boolean
          id?: string
          installment_months?: number
          location_lat?: number | null
          location_lng?: number | null
          price: number
          project_id: string
          reservation_fee?: number
          size_sqm: number
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_id: string
          type?: string
          unit_number: string
          view_type?: string | null
          virtual_tour_url?: string | null
        }
        Update: {
          balconies?: number
          bathrooms?: number
          bedrooms?: number
          building_id?: string
          created_at?: string
          custom_attributes?: Json | null
          down_payment_pct?: number
          finishing?: string | null
          floor?: number
          floor_plan_url?: string | null
          gallery?: Json | null
          garden_size?: number | null
          has_garden?: boolean
          id?: string
          installment_months?: number
          location_lat?: number | null
          location_lng?: number | null
          price?: number
          project_id?: string
          reservation_fee?: number
          size_sqm?: number
          status?: Database["public"]["Enums"]["unit_status"]
          tenant_id?: string
          type?: string
          unit_number?: string
          view_type?: string | null
          virtual_tour_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          national_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          national_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          national_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          max_budget: number | null
          notes: string | null
          notification_prefs: Json
          notified_at: string | null
          position: number
          preferred_floor: number | null
          preferred_type: string | null
          status: Database["public"]["Enums"]["waitlist_status"]
          tenant_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          max_budget?: number | null
          notes?: string | null
          notification_prefs?: Json
          notified_at?: string | null
          position: number
          preferred_floor?: number | null
          preferred_type?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
          tenant_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          max_budget?: number | null
          notes?: string | null
          notification_prefs?: Json
          notified_at?: string | null
          position?: number
          preferred_floor?: number | null
          preferred_type?: string | null
          status?: Database["public"]["Enums"]["waitlist_status"]
          tenant_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
          payload: Json
          provider: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
          payload?: Json
          provider: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
          payload?: Json
          provider?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_confirmation_number: { Args: never; Returns: string }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      mark_overdue_payments: { Args: never; Returns: undefined }
    }
    Enums: {
      billing_cycle: "monthly" | "yearly"
      document_status: "pending" | "approved" | "rejected"
      document_type: "national_id" | "proof_of_address" | "contract" | "receipt"
      followup_type:
        | "call"
        | "visit"
        | "message"
        | "email"
        | "whatsapp"
        | "other"
      lead_source:
        | "reservation_cancelled"
        | "waitlist_expired"
        | "inquiry"
        | "referral"
      negotiation_status:
        | "new"
        | "contacted"
        | "negotiating"
        | "offer_made"
        | "accepted"
        | "rejected"
        | "lost"
      notification_channel: "sms" | "email" | "push" | "in_app"
      notification_status: "pending" | "sent" | "failed" | "read"
      offer_status: "pending" | "accepted" | "rejected" | "countered"
      payment_status: "pending" | "paid" | "overdue" | "failed"
      payment_type: "reservation_fee" | "down_payment" | "installment"
      plan_tier: "starter" | "growth" | "pro"
      platform_payment_status: "pending" | "succeeded" | "failed" | "refunded"
      reservation_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "expired"
        | "rejected"
      subscription_status:
        | "pending_payment"
        | "active"
        | "past_due"
        | "expired"
        | "cancelled"
      tenant_status:
        | "active"
        | "suspended"
        | "trial"
        | "read_only"
        | "pending_signup"
      unit_status: "available" | "reserved" | "sold"
      user_role: "super_admin" | "admin" | "manager" | "agent" | "customer"
      waitlist_status:
        | "active"
        | "notified"
        | "converted"
        | "expired"
        | "removed"
        | "waiting"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_cycle: ["monthly", "yearly"],
      document_status: ["pending", "approved", "rejected"],
      document_type: ["national_id", "proof_of_address", "contract", "receipt"],
      followup_type: ["call", "visit", "message", "email", "whatsapp", "other"],
      lead_source: [
        "reservation_cancelled",
        "waitlist_expired",
        "inquiry",
        "referral",
      ],
      negotiation_status: [
        "new",
        "contacted",
        "negotiating",
        "offer_made",
        "accepted",
        "rejected",
        "lost",
      ],
      notification_channel: ["sms", "email", "push", "in_app"],
      notification_status: ["pending", "sent", "failed", "read"],
      offer_status: ["pending", "accepted", "rejected", "countered"],
      payment_status: ["pending", "paid", "overdue", "failed"],
      payment_type: ["reservation_fee", "down_payment", "installment"],
      plan_tier: ["starter", "growth", "pro"],
      platform_payment_status: ["pending", "succeeded", "failed", "refunded"],
      reservation_status: [
        "pending",
        "confirmed",
        "cancelled",
        "expired",
        "rejected",
      ],
      subscription_status: [
        "pending_payment",
        "active",
        "past_due",
        "expired",
        "cancelled",
      ],
      tenant_status: [
        "active",
        "suspended",
        "trial",
        "read_only",
        "pending_signup",
      ],
      unit_status: ["available", "reserved", "sold"],
      user_role: ["super_admin", "admin", "manager", "agent", "customer"],
      waitlist_status: [
        "active",
        "notified",
        "converted",
        "expired",
        "removed",
        "waiting",
        "cancelled",
      ],
    },
  },
} as const
