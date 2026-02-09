-- =============================================================================
-- Migration: Unify gigs and events into a single events table (Grand Unification)
-- Data Safety: See docs/MIGRATION_UNIFY_GIGS_EVENTS_SAFETY.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Add CRM fields to events (lifecycle_status already exists)
-- -----------------------------------------------------------------------------
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS crm_probability integer,
  ADD COLUMN IF NOT EXISTS crm_estimated_value numeric,
  ADD COLUMN IF NOT EXISTS lead_source text;

COMMENT ON COLUMN public.events.crm_probability IS 'CRM win probability 0-100';
COMMENT ON COLUMN public.events.crm_estimated_value IS 'CRM estimated deal value (from gig budget)';
COMMENT ON COLUMN public.events.lead_source IS 'Source of the lead/deal';

-- -----------------------------------------------------------------------------
-- Step 2: Map gig status to event_lifecycle_status (for UPDATE/INSERT)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _mig_gig_status_to_lifecycle(gig_status text)
RETURNS public.event_lifecycle_status
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE gig_status
    WHEN 'confirmed' THEN 'confirmed'::public.event_lifecycle_status
    WHEN 'run_of_show' THEN 'production'::public.event_lifecycle_status
    WHEN 'inquiry' THEN 'lead'::public.event_lifecycle_status
    WHEN 'proposal' THEN 'lead'::public.event_lifecycle_status
    WHEN 'contract_sent' THEN 'tentative'::public.event_lifecycle_status
    WHEN 'archived' THEN 'archived'::public.event_lifecycle_status
    WHEN 'cancelled' THEN 'cancelled'::public.event_lifecycle_status
    ELSE 'lead'::public.event_lifecycle_status
  END;
$$;

-- -----------------------------------------------------------------------------
-- Step 3: Update existing events that have gig_id with CRM data from gigs
-- -----------------------------------------------------------------------------
UPDATE public.events e
SET
  crm_estimated_value = g.budget_estimated,
  crm_probability      = CASE
    WHEN g.status IN ('confirmed', 'run_of_show') THEN 100
    WHEN g.status = 'contract_sent' THEN 75
    WHEN g.status = 'proposal' THEN 50
    WHEN g.status = 'inquiry' THEN 25
    ELSE NULL
  END,
  lifecycle_status     = COALESCE(e.lifecycle_status, _mig_gig_status_to_lifecycle(g.status))
FROM public.gigs g
WHERE e.gig_id = g.id;

-- -----------------------------------------------------------------------------
-- Step 4: Insert new events for gigs that do not have an event yet
-- -----------------------------------------------------------------------------
INSERT INTO public.events (
  id,
  workspace_id,
  title,
  starts_at,
  ends_at,
  status,
  location_name,
  gig_id,
  lifecycle_status,
  crm_estimated_value,
  crm_probability,
  client_id,
  actor,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  g.workspace_id,
  COALESCE(g.title, 'Untitled'),
  COALESCE(
    (g.event_date::date + time '08:00')::timestamptz,
    (current_date + time '08:00')::timestamptz
  ),
  COALESCE(
    (g.event_date::date + time '18:00')::timestamptz,
    (current_date + time '18:00')::timestamptz
  ),
  CASE g.status
    WHEN 'confirmed' THEN 'confirmed'::public.event_status
    WHEN 'run_of_show' THEN 'confirmed'::public.event_status
    WHEN 'cancelled' THEN 'cancelled'::public.event_status
    ELSE 'planned'::public.event_status
  END,
  COALESCE(g.event_location, g.location),
  g.id,
  _mig_gig_status_to_lifecycle(g.status),
  g.budget_estimated,
  CASE
    WHEN g.status IN ('confirmed', 'run_of_show') THEN 100
    WHEN g.status = 'contract_sent' THEN 75
    WHEN g.status = 'proposal' THEN 50
    WHEN g.status = 'inquiry' THEN 25
    ELSE NULL
  END,
  g.client_id,
  'migration',
  COALESCE(g.created_at, now()),
  now()
FROM public.gigs g
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.gig_id = g.id
);

-- -----------------------------------------------------------------------------
-- Step 5: Add event_id to child tables and migrate from gig_id
-- -----------------------------------------------------------------------------

-- contracts (gig_id nullable)
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS event_id uuid;
UPDATE public.contracts c
SET event_id = (SELECT id FROM public.events e WHERE e.gig_id = c.gig_id)
WHERE c.gig_id IS NOT NULL;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_gig_id_fkey;
ALTER TABLE public.contracts DROP COLUMN IF EXISTS gig_id;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.events(id);

-- invoices (gig_id NOT NULL → every invoice must get event_id from its gig)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
UPDATE public.invoices i
SET event_id = (SELECT id FROM public.events e WHERE e.gig_id = i.gig_id)
WHERE i.gig_id IS NOT NULL;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_gig_id_fkey;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS gig_id;
ALTER TABLE public.invoices ALTER COLUMN event_id SET NOT NULL;

-- proposals (gig_id NOT NULL)
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
UPDATE public.proposals p
SET event_id = (SELECT id FROM public.events e WHERE e.gig_id = p.gig_id)
WHERE p.gig_id IS NOT NULL;
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_gig_id_fkey;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS gig_id;
ALTER TABLE public.proposals ALTER COLUMN event_id SET NOT NULL;

-- run_of_show_cues (gig_id NOT NULL)
ALTER TABLE public.run_of_show_cues ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
UPDATE public.run_of_show_cues r
SET event_id = (SELECT id FROM public.events e WHERE e.gig_id = r.gig_id)
WHERE r.gig_id IS NOT NULL;
ALTER TABLE public.run_of_show_cues DROP CONSTRAINT IF EXISTS ros_cues_gig_id_fkey;
ALTER TABLE public.run_of_show_cues DROP COLUMN IF EXISTS gig_id;
ALTER TABLE public.run_of_show_cues ALTER COLUMN event_id SET NOT NULL;

-- run_of_show_items (gig_id nullable)
ALTER TABLE public.run_of_show_items ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
UPDATE public.run_of_show_items r
SET event_id = (SELECT id FROM public.events e WHERE e.gig_id = r.gig_id)
WHERE r.gig_id IS NOT NULL;
ALTER TABLE public.run_of_show_items DROP CONSTRAINT IF EXISTS run_of_show_items_gig_id_fkey;
ALTER TABLE public.run_of_show_items DROP COLUMN IF EXISTS gig_id;

-- -----------------------------------------------------------------------------
-- Step 6: Drop events.gig_id (no longer needed; all children now use event_id)
-- -----------------------------------------------------------------------------
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_gig_id_fkey;
ALTER TABLE public.events DROP COLUMN IF EXISTS gig_id;

-- -----------------------------------------------------------------------------
-- Step 7: Deprecate gigs table (do not drop; keep for rollback)
-- -----------------------------------------------------------------------------
ALTER TABLE public.gigs RENAME TO _deprecated_gigs;

-- -----------------------------------------------------------------------------
-- Step 8: Drop migration helper
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS _mig_gig_status_to_lifecycle(text);

-- -----------------------------------------------------------------------------
-- Step 9: RLS on events (workspace isolation; edit by admin or assigned)
-- -----------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Viewable by users in the same workspace (organization/tenant)
CREATE POLICY events_select_workspace
  ON public.events
  FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- Policy 2: Editable by workspace admins/owners OR assigned team (pm_id, producer_id)
CREATE POLICY events_update_workspace
  ON public.events
  FOR UPDATE
  USING (
    public.is_workspace_member(workspace_id)
    AND (
      public.is_workspace_owner(workspace_id)
      OR public.user_has_workspace_role(ARRAY['admin', 'owner'], workspace_id)
      OR pm_id = auth.uid()
      OR producer_id = auth.uid()
    )
  );

CREATE POLICY events_insert_workspace
  ON public.events
  FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY events_delete_workspace
  ON public.events
  FOR DELETE
  USING (
    public.is_workspace_member(workspace_id)
    AND (
      public.is_workspace_owner(workspace_id)
      OR public.user_has_workspace_role(ARRAY['admin', 'owner'], workspace_id)
    )
  );
