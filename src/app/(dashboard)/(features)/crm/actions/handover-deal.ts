'use server';

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';

export type HandoverResult =
  | { success: true; eventId: string }
  | { success: false; error: string };

/**
 * Hand over a deal to production: marks as won, creates an ops.events row, and links deal.event_id.
 * Requires a project for the workspace (ops.projects); uses first project if multiple.
 */
export async function handoverDeal(dealId: string): Promise<HandoverResult> {
  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    return { success: false, error: 'No active workspace.' };
  }

  const supabase = await createClient();

  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('id, title, status, proposed_date, workspace_id, event_id')
    .eq('id', dealId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (dealErr || !deal) {
    return { success: false, error: 'Deal not found.' };
  }

  const r = deal as Record<string, unknown>;
  if (r.event_id) {
    return { success: true, eventId: r.event_id as string };
  }

  const status = (r.status as string) ?? '';
  if (status !== 'inquiry' && status !== 'proposal' && status !== 'contract_sent') {
    return { success: false, error: 'Deal is not ready for handover.' };
  }

  let { data: projects, error: projErr } = await supabase
    .schema('ops')
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(1);

  if (projErr) {
    return { success: false, error: projErr.message };
  }

  let projectId: string;

  if (projects?.length) {
    projectId = (projects[0] as { id: string }).id;
  } else {
    // No project for workspace: create a default so the user can build proposals without a manual "add project" step
    const { data: inserted, error: insertErr } = await supabase
      .schema('ops')
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: 'Production',
        status: 'lead',
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      return { success: false, error: insertErr?.message ?? 'Could not create project for workspace.' };
    }
    projectId = (inserted as { id: string }).id;
  }
  const proposedDate = r.proposed_date ? String(r.proposed_date) : new Date().toISOString().slice(0, 10);
  const startAt = `${proposedDate}T08:00:00.000Z`;
  const endAt = `${proposedDate}T18:00:00.000Z`;
  const title = (r.title as string)?.trim() || 'Untitled Production';

  const { data: event, error: eventErr } = await supabase
    .schema('ops')
    .from('events')
    .insert({
      project_id: projectId,
      name: title,
      start_at: startAt,
      end_at: endAt,
    })
    .select('id')
    .single();

  if (eventErr) {
    console.error('[CRM] handoverDeal insert event:', eventErr.message);
    return { success: false, error: eventErr.message };
  }

  const eventId = (event as { id: string }).id;

  const { error: updateErr } = await supabase
    .from('deals')
    .update({ status: 'won', event_id: eventId, updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .eq('workspace_id', workspaceId);

  if (updateErr) {
    console.error('[CRM] handoverDeal update deal:', updateErr.message);
    return { success: false, error: updateErr.message };
  }

  // Create contract from accepted proposal (client signed during Liquid phase; event didn't exist yet)
  const { data: acceptedProposal } = await supabase
    .from('proposals')
    .select('id, accepted_at')
    .eq('deal_id', dealId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (acceptedProposal?.id) {
    const signedAt = (acceptedProposal as { accepted_at?: string | null }).accepted_at ?? new Date().toISOString();
    await supabase.from('contracts').insert({
      workspace_id: workspaceId,
      event_id: eventId,
      status: 'signed',
      signed_at: signedAt,
      pdf_url: null,
    });
  }

  revalidatePath('/crm');
  revalidatePath('/');
  return { success: true, eventId };
}
