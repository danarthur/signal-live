/**
 * Sales feature – Server Actions: packages, upsert proposal, publish proposal
 * @module features/sales/api/proposal-actions
 */

'use server';

import { createClient } from '@/shared/api/supabase/server';
import { getSystemClient } from '@/shared/api/supabase/system';
import type { Package } from '@/types/supabase';

// =============================================================================
// Types for action input/output
// =============================================================================

export interface ProposalLineItemInput {
  packageId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface GetPackagesResult {
  packages: Package[];
  error?: string;
}

export interface UpsertProposalResult {
  proposalId: string | null;
  total: number;
  error?: string;
}

export interface PublishProposalResult {
  publicToken: string | null;
  publicUrl: string | null;
  error?: string;
}

export interface SignProposalResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// getPackages(workspaceId): Fetch all active packages for a workspace
// =============================================================================

export async function getPackages(workspaceId: string): Promise<GetPackagesResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return { packages: [], error: error.message };
  }

  return { packages: (data ?? []) as Package[] };
}

// =============================================================================
// upsertProposal(gigId, items): Create or update draft proposal and line items
// =============================================================================

export async function upsertProposal(
  gigId: string,
  items: ProposalLineItemInput[]
): Promise<UpsertProposalResult> {
  const supabase = await createClient();

  // 1. Get gig for workspace_id
  const { data: gig, error: gigError } = await supabase
    .from('gigs')
    .select('id, workspace_id')
    .eq('id', gigId)
    .single();

  if (gigError || !gig) {
    return { proposalId: null, total: 0, error: gigError?.message ?? 'Gig not found' };
  }

  const workspaceId = (gig as { workspace_id: string }).workspace_id;

  // 2. Find existing draft proposal for this gig, or create one
  const { data: existing } = await supabase
    .from('proposals')
    .select('id')
    .eq('gig_id', gigId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let proposalId: string;

  if (existing?.id) {
    proposalId = existing.id;
    await supabase.from('proposal_items').delete().eq('proposal_id', proposalId);
  } else {
    const publicToken = crypto.randomUUID();
    const { data: inserted, error: insertError } = await supabase
      .from('proposals')
      .insert({
        workspace_id: workspaceId,
        gig_id: gigId,
        status: 'draft',
        public_token: publicToken,
      })
      .select('id')
      .single();

    if (insertError || !inserted?.id) {
      return { proposalId: null, total: 0, error: insertError?.message ?? 'Failed to create proposal' };
    }
    proposalId = inserted.id;
  }

  // 3. Insert proposal_items and compute total
  let total = 0;
  if (items.length > 0) {
    const rows = items.map((item, index) => ({
      proposal_id: proposalId,
      package_id: item.packageId ?? null,
      name: item.name,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_price: String(item.unitPrice),
      sort_order: index,
    }));

    const { error: itemsError } = await supabase.from('proposal_items').insert(rows);

    if (itemsError) {
      return { proposalId: null, total: 0, error: itemsError.message };
    }

    total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  return { proposalId, total };
}

// =============================================================================
// publishProposal(proposalId): Set status to 'sent', return public_token URL
// Uses service-role so RLS cannot block (user already proved access via upsert).
// =============================================================================

export async function publishProposal(proposalId: string): Promise<PublishProposalResult> {
  const supabase = getSystemClient();
  const now = new Date().toISOString();
  const publicToken = crypto.randomUUID();

  const { data, error } = await supabase
    .from('proposals')
    .update({
      status: 'sent',
      updated_at: now,
      public_token: publicToken,
    })
    .eq('id', proposalId)
    .eq('status', 'draft')
    .select('public_token')
    .single();

  if (error) {
    return {
      publicToken: null,
      publicUrl: null,
      error: error?.message ?? 'Proposal not found or not draft',
    };
  }

  const token = (data?.public_token as string) ?? publicToken;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const publicUrl = baseUrl ? `${baseUrl}/p/${token}` : `/p/${token}`;

  return { publicToken: token, publicUrl };
}

// =============================================================================
// signProposal(token, signatureName): Public client signs proposal by token
// Updates proposal status to 'accepted', creates contract with status 'signed'.
// Uses service-role to bypass RLS (caller is unauthenticated).
// =============================================================================

export async function signProposal(
  token: string,
  signatureName: string
): Promise<SignProposalResult> {
  const trimmedName = signatureName?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Please enter your full name to sign.' };
  }

  const supabase = getSystemClient();

  const { data: proposal, error: fetchError } = await supabase
    .from('proposals')
    .select('id, gig_id, workspace_id')
    .eq('public_token', token.trim())
    .in('status', ['sent', 'viewed'])
    .maybeSingle();

  if (fetchError || !proposal) {
    return { success: false, error: 'Proposal not found or already signed.' };
  }

  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposal.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const now = new Date().toISOString();
  const { error: contractError } = await supabase.from('contracts').insert({
    workspace_id: proposal.workspace_id,
    gig_id: proposal.gig_id,
    status: 'signed',
    signed_at: now,
    pdf_url: null,
  });

  if (contractError) {
    return { success: false, error: contractError.message };
  }

  return { success: true };
}
