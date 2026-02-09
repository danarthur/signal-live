'use server';

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';

const createGigSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  eventDate: z.string().nullable().optional(),
  status: z.enum(['inquiry', 'proposal', 'contract_sent', 'hold', 'confirmed', 'run_of_show', 'cancelled', 'archived']).default('inquiry'),
  location: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  venueId: z.string().uuid().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  mainContactId: z.string().uuid().nullable().optional(),
  eventStartAt: z.string().nullable().optional(),
  eventEndAt: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  occurrenceType: z.enum(['single', 'recurring', 'multi_day']).optional(),
});

export type CreateGigInput = z.infer<typeof createGigSchema>;

export type CreateGigResult =
  | { success: true; gigId: string }
  | { success: false; error: string };

/**
 * Creates a new gig in the active workspace.
 * workspace_id is derived server-side – never trusted from the client.
 * DB trigger sync_gig_to_event will automatically create the corresponding event.
 */
export async function createGig(input: CreateGigInput): Promise<CreateGigResult> {
  try {
    const parsed = createGigSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.title?.[0] ?? parsed.error.message;
      return { success: false, error: msg };
    }

    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return {
        success: false,
        error: 'No active workspace. Complete onboarding or select a workspace.',
      };
    }

    const { title, eventDate, status, location, clientName, venueId, organizationId, mainContactId, eventStartAt, eventEndAt, isRecurring, occurrenceType } = parsed.data;

    const supabase = await createClient();

    const insertData: Record<string, unknown> = {
      workspace_id: workspaceId,
      title: title.trim(),
      event_date: eventDate ?? null,
      status,
      location: location?.trim() ?? null,
      client_name: clientName?.trim() ?? null,
      venue_id: venueId ?? null,
      organization_id: organizationId ?? null,
      main_contact_id: mainContactId ?? null,
    };

    if (eventStartAt != null) insertData.event_start_at = eventStartAt;
    if (eventEndAt != null) insertData.event_end_at = eventEndAt;
    if (isRecurring != null) insertData.is_recurring = isRecurring;
    if (occurrenceType != null) insertData.occurrence_type = occurrenceType;

    const { data: gig, error } = await supabase
      .from('gigs')
      .insert(insertData as Record<string, never>)
      .select('id')
      .single();

    if (error) {
      console.error('[CRM] createGig error:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/crm');
    revalidatePath('/');
    revalidatePath('/calendar');

    return { success: true, gigId: gig.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create gig';
    console.error('[CRM] createGig unexpected:', err);
    return { success: false, error: message };
  }
}
