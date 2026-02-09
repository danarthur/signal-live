/**
 * Public Proposal Viewer – DTO for client portal (by public_token)
 * @module features/sales/model/public-proposal
 */

import type { Proposal, ProposalItem } from '@/types/supabase';

export interface PublicProposalGig {
  id: string;
  title: string;
  clientName: string | null;
  eventDate: string | null;
}

export interface PublicProposalWorkspace {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface PublicProposalItem extends ProposalItem {
  packageImageUrl?: string | null;
}

export interface PublicProposalDTO {
  proposal: Proposal;
  gig: PublicProposalGig;
  workspace: PublicProposalWorkspace;
  items: PublicProposalItem[];
  total: number;
}
