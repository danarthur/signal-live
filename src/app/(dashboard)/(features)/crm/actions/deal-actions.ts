'use server';

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';
import { DEAL_ARCHETYPES } from './deal-model';

const createDealSchema = z.object({
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be yyyy-MM-dd'),
  eventArchetype: z.enum(DEAL_ARCHETYPES).nullable().optional(),
  title: z.string().max(500).nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  mainContactId: z.string().uuid().nullable().optional(),
  status: z.enum(['inquiry', 'proposal', 'contract_sent', 'won', 'lost']).default('inquiry'),
  budgetEstimated: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  venueId: z.string().uuid().nullable().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type CreateDealResult =
  | { success: true; dealId: string }
  | { success: false; error: string };

/**
 * Creates a new deal (inquiry) in the active workspace.
 * Writes to Deals table only. No Event row until deal is signed (Phase 2).
 */
export async function createDeal(input: CreateDealInput): Promise<CreateDealResult> {
  try {
    const parsed = createDealSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.proposedDate?.[0] ?? parsed.error.message;
      return { success: false, error: msg };
    }

    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return {
        success: false,
        error: 'No active workspace. Complete onboarding or select a workspace.',
      };
    }

    const {
      proposedDate,
      eventArchetype,
      title,
      organizationId,
      mainContactId,
      status,
      budgetEstimated,
      notes,
      venueId,
    } = parsed.data;

    const supabase = await createClient();

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        workspace_id: workspaceId,
        proposed_date: proposedDate,
        event_archetype: eventArchetype ?? null,
        title: title?.trim() ?? null,
        organization_id: organizationId ?? null,
        main_contact_id: mainContactId ?? null,
        status,
        budget_estimated: budgetEstimated ?? null,
        notes: notes?.trim() ?? null,
        venue_id: venueId ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[CRM] createDeal error:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/crm');
    revalidatePath('/');

    return { success: true, dealId: deal.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create deal';
    console.error('[CRM] createDeal unexpected:', err);
    return { success: false, error: message };
  }
}
