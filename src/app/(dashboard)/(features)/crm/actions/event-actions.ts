'use server';

import { createClient } from '@/shared/api/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getActiveWorkspaceId } from '@/shared/lib/workspace';

const eventStatusSchema = z.enum(['planned', 'confirmed', 'hold', 'cancelled']);

const isoDatetime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
  message: 'Invalid ISO date/time string',
});

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  startsAt: isoDatetime,
  endsAt: isoDatetime,
  status: eventStatusSchema.default('planned'),
  locationName: z.string().nullable().optional(),
  gigId: z.string().uuid().nullable().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export type CreateEventResult =
  | { success: true; eventId: string }
  | { success: false; error: string };

/**
 * Creates an event in the active workspace.
 * workspace_id is derived server-side – never trusted from the client.
 *
 * Parent Verification: If gig_id is provided, the gig must exist and belong
 * to the active workspace. Prevents cross-workspace injection.
 */
export async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  try {
    const parsed = createEventSchema.safeParse(input);
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

    const { title, startsAt, endsAt, status, locationName, gigId } = parsed.data;

    const supabase = await createClient();

    if (gigId) {
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('id, workspace_id')
        .eq('id', gigId)
        .maybeSingle();

      if (gigError) {
        console.error('[CRM] createEvent gig lookup error:', gigError.message);
        return { success: false, error: gigError.message };
      }

      if (!gig) {
        return { success: false, error: 'Gig not found.' };
      }

      const gigWorkspaceId = (gig as { workspace_id?: string }).workspace_id;
      if (gigWorkspaceId !== workspaceId) {
        return {
          success: false,
          error: 'Invalid Gig Context. This gig belongs to a different workspace.',
        };
      }
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        status,
        location_name: locationName?.trim() ?? null,
        gig_id: gigId ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[CRM] createEvent error:', error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/calendar');
    revalidatePath('/crm');

    return { success: true, eventId: event.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    console.error('[CRM] createEvent unexpected:', err);
    return { success: false, error: message };
  }
}
