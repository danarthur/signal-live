/**
 * Supabase generated types (minimal stub post migration).
 * After applying supabase/migrations/*_unify_gigs_events.sql, run:
 *   npm run db:types
 * to regenerate full types from your project.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase?: { PostgrestVersion: string };
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          status: string;
          lifecycle_status: string | null;
          location_name: string | null;
          client_id: string | null;
          crm_probability: number | null;
          crm_estimated_value: number | null;
          lead_source: string | null;
          pm_id: string | null;
          producer_id: string | null;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      packages: {
        Row: { id: string; name: string; category: string; price: number; workspace_id: string; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      invoices: {
        Row: { id: string; event_id: string; workspace_id: string; total_amount: number; status: string; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      proposals: {
        Row: { id: string; event_id: string; workspace_id: string; status: string; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      proposal_items: {
        Row: { id: string; proposal_id: string; name: string; quantity: number; unit_price: number; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      run_of_show_cues: {
        Row: { id: string; event_id: string; title: string; sort_order: number; type: string | null; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      run_of_show_items: {
        Row: { id: string; event_id: string | null; activity: string; order_index: number; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      contracts: { Row: { id: string; event_id: string | null; workspace_id: string; [key: string]: unknown }; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: unknown[] };
      /** @deprecated Use events with lifecycle_status = 'lead'. Table renamed to _deprecated_gigs after migration. */
      gigs: {
        Row: { id: string; title: string | null; event_date: string | null; status: string | null; location: string | null; event_location: string | null; workspace_id: string; [key: string]: unknown };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
      workspace_members: { Row: { user_id: string; workspace_id: string; role: string; [key: string]: unknown }; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: unknown[] };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Enums: {
      payment_method: 'credit_card' | 'wire' | 'check' | 'cash' | 'stripe';
      cue_type: 'stage' | 'audio' | 'lighting' | 'video' | 'logistics';
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
      proposal_status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
      event_status: 'planned' | 'confirmed' | 'completed' | 'canceled' | 'booked' | 'hold' | 'cancelled';
      event_lifecycle_status: 'lead' | 'tentative' | 'confirmed' | 'production' | 'live' | 'post' | 'archived' | 'cancelled';
      [key: string]: string | string[];
    };
    Views: { [_ in never]: never };
    Functions: Record<string, unknown>;
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T] extends { Row: infer R } ? R : never;
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T] extends { Insert: infer I } ? I : never;
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T] extends { Update: infer U } ? U : never;
export type Enums<E extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][E];

export type Package = Tables<'packages'>;
export type PaymentMethod = Enums<'payment_method'>;
export type Proposal = Tables<'proposals'>;
export type ProposalItem = Tables<'proposal_items'>;
export type Cue = Tables<'run_of_show_cues'>;
export type CueType = Enums<'cue_type'>;

export const Constants = {
  public: {
    Enums: {
      event_lifecycle_status: ['lead', 'tentative', 'confirmed', 'production', 'live', 'post', 'archived', 'cancelled'],
      cue_type: ['stage', 'audio', 'lighting', 'video', 'logistics'],
      invoice_status: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      proposal_status: ['draft', 'sent', 'viewed', 'accepted', 'rejected'],
    },
  },
} as const;
