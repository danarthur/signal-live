/**
 * Sales feature – Deal Room DTOs and pipeline types
 * @module features/sales/model/types
 */

import type { Proposal, ProposalItem } from '@/types/supabase';

// =============================================================================
// Deal Room DTO
// =============================================================================

export interface DealRoomGig {
  id: string;
  workspaceId: string;
  title: string;
  status: string;
  clientName: string | null;
  clientEmail: string | null;
}

export interface DealRoomPipeline {
  currentStage: number;
  stages: string[];
}

export interface DealRoomContract {
  status: string;
  signedAt: string | null;
  pdfUrl: string | null;
}

export interface DealRoomStats {
  totalValue: number;
  probability: number;
}

export interface DealRoomDTO {
  gig: DealRoomGig;
  pipeline: DealRoomPipeline;
  activeProposal: ProposalWithItems | null;
  contract: DealRoomContract | null;
  stats: DealRoomStats;
}

// =============================================================================
// Proposal with items (for active proposal display)
// =============================================================================

export interface ProposalWithItems extends Proposal {
  items: ProposalItem[];
}

// =============================================================================
// Pipeline stage labels (0–5)
// =============================================================================

export const PIPELINE_STAGES = [
  'Inquiry',
  'Proposal Drafted',
  'Proposal Sent',
  'Negotiation',
  'Contract Signed',
  'Deposit Paid',
] as const;

export type PipelineStageLabel = (typeof PIPELINE_STAGES)[number];

// =============================================================================
// Proposal Builder – line item shape for UI (optimistic / receipt)
// =============================================================================

export interface ProposalBuilderLineItem {
  /** Optional: set when from existing proposal_item */
  id?: string;
  packageId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
}

/** Hardcoded suggestion: when user adds this package name, suggest the other. */
export const PACKAGE_SUGGESTIONS: { whenAdded: string; suggest: string }[] = [
  { whenAdded: 'Audio Array', suggest: 'A1 Engineer' },
];
