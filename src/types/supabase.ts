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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _deprecated_gigs: {
        Row: {
          budget_actual: number | null
          budget_estimated: number | null
          client_id: string | null
          client_name: string | null
          created_at: string
          date: string | null
          event_date: string | null
          event_location: string | null
          id: string
          location: string | null
          main_contact_id: string | null
          organization_id: string | null
          status: string | null
          title: string
          venue_id: string | null
          vibe_keywords: string[] | null
          workspace_id: string
        }
        Insert: {
          budget_actual?: number | null
          budget_estimated?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          event_date?: string | null
          event_location?: string | null
          id?: string
          location?: string | null
          main_contact_id?: string | null
          organization_id?: string | null
          status?: string | null
          title: string
          venue_id?: string | null
          vibe_keywords?: string[] | null
          workspace_id: string
        }
        Update: {
          budget_actual?: number | null
          budget_estimated?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          event_date?: string | null
          event_location?: string | null
          id?: string
          location?: string | null
          main_contact_id?: string | null
          organization_id?: string | null
          status?: string | null
          title?: string
          venue_id?: string | null
          vibe_keywords?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_main_contact_id_fkey"
            columns: ["main_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_name: string
          agent_response: string | null
          completed_at: string | null
          cost_usd: number | null
          error_log: string | null
          id: string
          input_context: Json | null
          model: string | null
          output_result: Json | null
          persona_id: string | null
          persona_used: string | null
          started_at: string
          status: string
          tokens_used: number | null
          user_feedback: string | null
          user_message: string | null
          user_rating: number | null
          workspace_id: string
        }
        Insert: {
          agent_name?: string
          agent_response?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          error_log?: string | null
          id?: string
          input_context?: Json | null
          model?: string | null
          output_result?: Json | null
          persona_id?: string | null
          persona_used?: string | null
          started_at?: string
          status?: string
          tokens_used?: number | null
          user_feedback?: string | null
          user_message?: string | null
          user_rating?: number | null
          workspace_id: string
        }
        Update: {
          agent_name?: string
          agent_response?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          error_log?: string | null
          id?: string
          input_context?: Json | null
          model?: string | null
          output_result?: Json | null
          persona_id?: string | null
          persona_used?: string | null
          started_at?: string
          status?: string
          tokens_used?: number | null
          user_feedback?: string | null
          user_message?: string | null
          user_rating?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          actor: string
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          review_frequency: string | null
          standards: string | null
          status: Database["public"]["Enums"]["area_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          review_frequency?: string | null
          standards?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          review_frequency?: string | null
          standards?: string | null
          status?: Database["public"]["Enums"]["area_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          size_bytes: number | null
          spine_item_id: string | null
          token_count: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          size_bytes?: number | null
          spine_item_id?: string | null
          token_count?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          size_bytes?: number | null
          spine_item_id?: string | null
          token_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_spine_item_id_fkey"
            columns: ["spine_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          avatar_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          status: string | null
          type: string | null
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string | null
          type?: string | null
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          organization_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          pdf_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      event_people: {
        Row: {
          created_at: string
          event_id: string
          person_id: string
          role: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          person_id: string
          role?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          person_id?: string
          role?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_people_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_people_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor: string
          archived_at: string | null
          client_id: string | null
          compliance_docs: Json | null
          confidentiality_level:
            | Database["public"]["Enums"]["confidentiality_level"]
            | null
          created_at: string
          created_by: string | null
          crm_estimated_value: number | null
          crm_probability: number | null
          dates_load_in: string | null
          dates_load_out: string | null
          ends_at: string
          external_calendar_event_id: string | null
          external_calendar_provider: string | null
          guest_count_actual: number | null
          guest_count_expected: number | null
          id: string
          internal_code: string | null
          lead_source: string | null
          lifecycle_status:
            | Database["public"]["Enums"]["event_lifecycle_status"]
            | null
          location_address: string | null
          location_name: string | null
          logistics_dock_info: string | null
          logistics_power_info: string | null
          notes: string | null
          pm_id: string | null
          producer_id: string | null
          project_id: string | null
          slug: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tech_requirements: Json | null
          title: string
          updated_at: string
          updated_by: string | null
          venue_address: string | null
          venue_google_maps_id: string | null
          venue_name: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          archived_at?: string | null
          client_id?: string | null
          compliance_docs?: Json | null
          confidentiality_level?:
            | Database["public"]["Enums"]["confidentiality_level"]
            | null
          created_at?: string
          created_by?: string | null
          crm_estimated_value?: number | null
          crm_probability?: number | null
          dates_load_in?: string | null
          dates_load_out?: string | null
          ends_at: string
          external_calendar_event_id?: string | null
          external_calendar_provider?: string | null
          guest_count_actual?: number | null
          guest_count_expected?: number | null
          id?: string
          internal_code?: string | null
          lead_source?: string | null
          lifecycle_status?:
            | Database["public"]["Enums"]["event_lifecycle_status"]
            | null
          location_address?: string | null
          location_name?: string | null
          logistics_dock_info?: string | null
          logistics_power_info?: string | null
          notes?: string | null
          pm_id?: string | null
          producer_id?: string | null
          project_id?: string | null
          slug?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          tech_requirements?: Json | null
          title: string
          updated_at?: string
          updated_by?: string | null
          venue_address?: string | null
          venue_google_maps_id?: string | null
          venue_name?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          archived_at?: string | null
          client_id?: string | null
          compliance_docs?: Json | null
          confidentiality_level?:
            | Database["public"]["Enums"]["confidentiality_level"]
            | null
          created_at?: string
          created_by?: string | null
          crm_estimated_value?: number | null
          crm_probability?: number | null
          dates_load_in?: string | null
          dates_load_out?: string | null
          ends_at?: string
          external_calendar_event_id?: string | null
          external_calendar_provider?: string | null
          guest_count_actual?: number | null
          guest_count_expected?: number | null
          id?: string
          internal_code?: string | null
          lead_source?: string | null
          lifecycle_status?:
            | Database["public"]["Enums"]["event_lifecycle_status"]
            | null
          location_address?: string | null
          location_name?: string | null
          logistics_dock_info?: string | null
          logistics_power_info?: string | null
          notes?: string | null
          pm_id?: string | null
          producer_id?: string | null
          project_id?: string | null
          slug?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          tech_requirements?: Json | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          venue_address?: string | null
          venue_google_maps_id?: string | null
          venue_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          event_id: string
          id: string
          qbo_id: string
          transaction_date: string | null
          updated_at: string | null
          vendor_name: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          qbo_id: string
          transaction_date?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          qbo_id?: string
          transaction_date?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_invoices: {
        Row: {
          amount: number
          balance: number
          created_at: string | null
          currency: string | null
          due_date: string | null
          event_id: string
          id: string
          qbo_doc_number: string | null
          qbo_id: string
          status: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          balance?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          qbo_doc_number?: string | null
          qbo_id: string
          status?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          balance?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          qbo_doc_number?: string | null
          qbo_id?: string
          status?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox: {
        Row: {
          ai_action_items: string | null
          ai_summary: string | null
          ai_urgency: string | null
          body: string | null
          id: number
          metadata: Json | null
          processed: boolean | null
          received_at: string | null
          sender_email: string | null
          subject: string | null
        }
        Insert: {
          ai_action_items?: string | null
          ai_summary?: string | null
          ai_urgency?: string | null
          body?: string | null
          id?: number
          metadata?: Json | null
          processed?: boolean | null
          received_at?: string | null
          sender_email?: string | null
          subject?: string | null
        }
        Update: {
          ai_action_items?: string | null
          ai_summary?: string | null
          ai_urgency?: string | null
          body?: string | null
          id?: number
          metadata?: Json | null
          processed?: boolean | null
          received_at?: string | null
          sender_email?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          cost: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          amount?: number
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_details: Json | null
          created_at: string
          due_date: string
          event_id: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          proposal_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount: number
          tax_amount: number
          token: string
          total_amount: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          billing_details?: Json | null
          created_at?: string
          due_date: string
          event_id: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number
          tax_amount?: number
          token?: string
          total_amount?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          billing_details?: Json | null
          created_at?: string
          due_date?: string
          event_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number
          tax_amount?: number
          token?: string
          total_amount?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          name: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          default_venue_id: string | null
          id: string
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          default_venue_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          default_venue_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_default_venue_id_fkey"
            columns: ["default_venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          category: Database["public"]["Enums"]["package_category"]
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["package_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["package_category"]
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          received_at: string
          reference_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          received_at?: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          received_at?: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          actor: string
          archived_at: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          parent_id: string | null
          phone: string | null
          relationship: Database["public"]["Enums"]["person_relationship"]
          type: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          archived_at?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          parent_id?: string | null
          phone?: string | null
          relationship?: Database["public"]["Enums"]["person_relationship"]
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          archived_at?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          parent_id?: string | null
          phone?: string | null
          relationship?: Database["public"]["Enums"]["person_relationship"]
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string
          emotional_setting: Json | null
          id: string
          is_default: boolean | null
          name: string
          response_style: Json | null
          system_prompt: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          emotional_setting?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          response_style?: Json | null
          system_prompt: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          emotional_setting?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          response_style?: Json | null
          system_prompt?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          actor: string
          archived_at: string | null
          area_id: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          name: string
          outcome: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          name: string
          outcome?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          name?: string
          outcome?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          package_id: string | null
          proposal_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          package_id?: string | null
          proposal_id: string
          quantity?: number
          sort_order?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          package_id?: string | null
          proposal_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          event_id: string
          id: string
          public_token: string
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
          valid_until: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          public_token?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          public_token?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_configs: {
        Row: {
          access_token: string
          created_at: string | null
          realm_id: string
          reconnect_url: string | null
          refresh_token: string
          token_expires_at: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          realm_id: string
          reconnect_url?: string | null
          refresh_token: string
          token_expires_at: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          realm_id?: string
          reconnect_url?: string | null
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_project_mappings: {
        Row: {
          created_at: string | null
          id: string
          internal_event_id: string
          qbo_project_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          internal_event_id: string
          qbo_project_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          internal_event_id?: string
          qbo_project_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_project_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      qbo_sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          external_event_id: string | null
          payload: Json
          source: string
          status: Database["public"]["Enums"]["qbo_sync_status"]
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type: string
          external_event_id?: string | null
          payload?: Json
          source: string
          status?: Database["public"]["Enums"]["qbo_sync_status"]
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          external_event_id?: string | null
          payload?: Json
          source?: string
          status?: Database["public"]["Enums"]["qbo_sync_status"]
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qbo_sync_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      run_of_show_cues: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_id: string
          id: string
          notes: string | null
          sort_order: number
          start_time: string | null
          title: string
          type: Database["public"]["Enums"]["cue_type"] | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          event_id: string
          id?: string
          notes?: string | null
          sort_order: number
          start_time?: string | null
          title: string
          type?: Database["public"]["Enums"]["cue_type"] | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          event_id?: string
          id?: string
          notes?: string | null
          sort_order?: number
          start_time?: string | null
          title?: string
          type?: Database["public"]["Enums"]["cue_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "run_of_show_cues_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      run_of_show_items: {
        Row: {
          activity: string
          audio_cue: string | null
          duration_minutes: number | null
          event_id: string | null
          id: string
          lighting_cue: string | null
          order_index: number
          start_time: string | null
          visual_cue: string | null
        }
        Insert: {
          activity: string
          audio_cue?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          id?: string
          lighting_cue?: string | null
          order_index?: number
          start_time?: string | null
          visual_cue?: string | null
        }
        Update: {
          activity?: string
          audio_cue?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          id?: string
          lighting_cue?: string | null
          order_index?: number
          start_time?: string | null
          visual_cue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "run_of_show_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      spine_audits: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string
          table_name: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id: string
          table_name: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          workspace_id?: string
        }
        Relationships: []
      }
      spine_item_people: {
        Row: {
          created_at: string
          person_id: string
          spine_item_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          person_id: string
          spine_item_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          person_id?: string
          spine_item_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spine_item_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_people_spine_item_id_fkey"
            columns: ["spine_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_people_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spine_item_provenance: {
        Row: {
          bounding_box: Json | null
          created_at: string
          id: string
          page_number: number | null
          quote_text: string
          similarity_score: number | null
          spine_item_id: string
          workspace_id: string
        }
        Insert: {
          bounding_box?: Json | null
          created_at?: string
          id?: string
          page_number?: number | null
          quote_text: string
          similarity_score?: number | null
          spine_item_id: string
          workspace_id: string
        }
        Update: {
          bounding_box?: Json | null
          created_at?: string
          id?: string
          page_number?: number | null
          quote_text?: string
          similarity_score?: number | null
          spine_item_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spine_item_provenance_spine_item_id_fkey"
            columns: ["spine_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_provenance_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spine_item_relations: {
        Row: {
          created_at: string
          from_item_id: string
          reasoning: string | null
          relation_type: string
          to_item_id: string
          updated_at: string
          weight: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          from_item_id: string
          reasoning?: string | null
          relation_type?: string
          to_item_id: string
          updated_at?: string
          weight?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          from_item_id?: string
          reasoning?: string | null
          relation_type?: string
          to_item_id?: string
          updated_at?: string
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spine_item_relations_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_relations_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spine_item_tags: {
        Row: {
          created_at: string
          spine_item_id: string
          tag_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          spine_item_id: string
          tag_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          spine_item_id?: string
          tag_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spine_item_tags_spine_item_id_fkey"
            columns: ["spine_item_id"]
            isOneToOne: false
            referencedRelation: "spine_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_item_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spine_items: {
        Row: {
          actor: string
          affective_context: Json | null
          archived_at: string | null
          area_id: string | null
          body: string | null
          content_json: Json | null
          created_at: string
          created_by: string | null
          embedding: string | null
          event_id: string | null
          fts_vector: unknown
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          processed_at: string | null
          project_id: string | null
          sentiment_score: number | null
          source: Database["public"]["Enums"]["source_type"]
          source_external_id: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["spine_item_status"]
          summary: string | null
          tags: string[] | null
          task_id: string | null
          title: string
          type: Database["public"]["Enums"]["spine_item_type"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          affective_context?: Json | null
          archived_at?: string | null
          area_id?: string | null
          body?: string | null
          content_json?: Json | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          event_id?: string | null
          fts_vector?: unknown
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          processed_at?: string | null
          project_id?: string | null
          sentiment_score?: number | null
          source?: Database["public"]["Enums"]["source_type"]
          source_external_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["spine_item_status"]
          summary?: string | null
          tags?: string[] | null
          task_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["spine_item_type"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          affective_context?: Json | null
          archived_at?: string | null
          area_id?: string | null
          body?: string | null
          content_json?: Json | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          event_id?: string | null
          fts_vector?: unknown
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          processed_at?: string | null
          project_id?: string | null
          sentiment_score?: number | null
          source?: Database["public"]["Enums"]["source_type"]
          source_external_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["spine_item_status"]
          summary?: string | null
          tags?: string[] | null
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["spine_item_type"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spine_items_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spine_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          blocking_task_id: string
          created_at: string
          dependent_task_id: string
          workspace_id: string
        }
        Insert: {
          blocking_task_id: string
          created_at?: string
          dependent_task_id: string
          workspace_id: string
        }
        Update: {
          blocking_task_id?: string
          created_at?: string
          dependent_task_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_deps_blocking_fkey"
            columns: ["blocking_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_deps_dependent_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actor: string
          archived_at: string | null
          area_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          do_date: string | null
          due_date: string | null
          estimate_min: number | null
          id: string
          metadata: Json | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          actor?: string
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          do_date?: string | null
          due_date?: string | null
          estimate_min?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          actor?: string
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          do_date?: string | null
          due_date?: string | null
          estimate_min?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          is_favorite: boolean | null
          name: string
          state: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          state?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          state?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          department: string | null
          permissions: Json | null
          primary_location_id: string | null
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          permissions?: Json | null
          primary_location_id?: string | null
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          permissions?: Json | null
          primary_location_id?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invite_code: string | null
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string | null
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: { Args: never; Returns: boolean }
      create_default_location: {
        Args: { p_location_name?: string; p_workspace_id: string }
        Returns: string
      }
      create_draft_invoice_from_proposal: {
        Args: { p_proposal_id: string }
        Returns: string
      }
      get_active_workspace_id: { Args: never; Returns: string }
      get_member_permissions: {
        Args: { p_user_id?: string; p_workspace_id: string }
        Returns: Json
      }
      get_user_workspace_ids: { Args: never; Returns: string[] }
      is_member_of: { Args: { _workspace_id: string }; Returns: boolean }
      is_workspace_member: { Args: { w_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { w_id: string }; Returns: boolean }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          query_text?: string
        }
        Returns: {
          body: string
          id: string
          similarity: number
          summary: string
        }[]
      }
      member_has_permission: {
        Args: { p_permission_key: string; p_workspace_id: string }
        Returns: boolean
      }
      regenerate_invite_code: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      search_spine: {
        Args: {
          filter_workspace_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
          query_text?: string
        }
        Returns: {
          affective_context: Json
          body: string
          id: string
          similarity: number
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_has_workspace_role: {
        Args: { p_roles: string[]; p_workspace_id: string }
        Returns: boolean
      }
      workspace_created_by_me: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      workspace_joinable_by_invite: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      area_status: "active" | "archived"
      confidentiality_level: "public" | "private" | "secret"
      contract_status: "draft" | "sent" | "signed"
      cue_type: "stage" | "audio" | "lighting" | "video" | "logistics"
      event_lifecycle_status:
        | "lead"
        | "tentative"
        | "confirmed"
        | "production"
        | "live"
        | "post"
        | "archived"
        | "cancelled"
      event_status:
        | "planned"
        | "confirmed"
        | "completed"
        | "canceled"
        | "booked"
        | "hold"
        | "cancelled"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      package_category: "service" | "rental" | "talent" | "package"
      payment_method: "credit_card" | "wire" | "check" | "cash" | "stripe"
      payment_status: "succeeded" | "pending" | "failed"
      person_relationship:
        | "family"
        | "friend"
        | "client"
        | "vendor"
        | "partner"
        | "lead"
        | "team"
        | "other"
      priority_level: "p0" | "p1" | "p2" | "p3"
      project_status: "active" | "paused" | "completed" | "archived"
      proposal_status: "draft" | "sent" | "viewed" | "accepted" | "rejected"
      qbo_sync_status: "pending" | "processing" | "completed" | "failed"
      source_type:
        | "manual"
        | "ios_shortcut"
        | "email"
        | "sms"
        | "web"
        | "calendar"
        | "n8n"
        | "notion"
        | "import"
        | "agent"
      spine_item_status:
        | "inbox"
        | "active"
        | "waiting"
        | "scheduled"
        | "someday"
        | "reference"
        | "archived"
        | "deleted"
      spine_item_type:
        | "note"
        | "task"
        | "event"
        | "person"
        | "project"
        | "area"
        | "decision"
        | "idea"
        | "file"
        | "link"
        | "message"
        | "journal"
        | "finance_data"
      task_status: "inbox" | "next" | "doing" | "waiting" | "done" | "dropped"
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

/** Row type for run_of_show_cues table */
export type Cue = Tables<"run_of_show_cues">
/** Enum for cue type (stage, audio, lighting, video, logistics) */
export type CueType = Enums<"cue_type">

/** Row type for proposals table */
export type Proposal = Tables<"proposals">
/** Row type for proposal_items table */
export type ProposalItem = Tables<"proposal_items">
/** Row type for packages table */
export type Package = Tables<"packages">
/** Enum for payment method */
export type PaymentMethod = Enums<"payment_method">

export const Constants = {
  public: {
    Enums: {
      area_status: ["active", "archived"],
      confidentiality_level: ["public", "private", "secret"],
      contract_status: ["draft", "sent", "signed"],
      cue_type: ["stage", "audio", "lighting", "video", "logistics"],
      event_lifecycle_status: [
        "lead",
        "tentative",
        "confirmed",
        "production",
        "live",
        "post",
        "archived",
        "cancelled",
      ],
      event_status: [
        "planned",
        "confirmed",
        "completed",
        "canceled",
        "booked",
        "hold",
        "cancelled",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      package_category: ["service", "rental", "talent", "package"],
      payment_method: ["credit_card", "wire", "check", "cash", "stripe"],
      payment_status: ["succeeded", "pending", "failed"],
      person_relationship: [
        "family",
        "friend",
        "client",
        "vendor",
        "partner",
        "lead",
        "team",
        "other",
      ],
      priority_level: ["p0", "p1", "p2", "p3"],
      project_status: ["active", "paused", "completed", "archived"],
      proposal_status: ["draft", "sent", "viewed", "accepted", "rejected"],
      qbo_sync_status: ["pending", "processing", "completed", "failed"],
      source_type: [
        "manual",
        "ios_shortcut",
        "email",
        "sms",
        "web",
        "calendar",
        "n8n",
        "notion",
        "import",
        "agent",
      ],
      spine_item_status: [
        "inbox",
        "active",
        "waiting",
        "scheduled",
        "someday",
        "reference",
        "archived",
        "deleted",
      ],
      spine_item_type: [
        "note",
        "task",
        "event",
        "person",
        "project",
        "area",
        "decision",
        "idea",
        "file",
        "link",
        "message",
        "journal",
        "finance_data",
      ],
      task_status: ["inbox", "next", "doing", "waiting", "done", "dropped"],
    },
  },
} as const
