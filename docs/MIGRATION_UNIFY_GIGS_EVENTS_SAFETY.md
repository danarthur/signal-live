# Data Safety: Unify Gigs → Events Migration

**⚠️ CONFIRM BEFORE EXECUTING SQL IN PRODUCTION**

This migration:

1. **Adds columns** to `events`: `crm_probability` (int), `crm_estimated_value` (numeric), `lead_source` (text). No data loss.
2. **Updates** existing `events` rows that have `gig_id` with CRM data from the linked gig. No row deletion.
3. **Inserts** new `events` rows for gigs that do not yet have an event (`events.gig_id` = that gig). New UUIDs are generated for these events.
4. **Adds** `event_id` to: `contracts`, `invoices`, `proposals`, `run_of_show_cues`, `run_of_show_items`; populates from `events.id` where `events.gig_id` = table’s `gig_id`.
5. **Drops** `gig_id` FKs and columns from those tables; adds `event_id` FKs to `events`. **Risk:** If any row has a `gig_id` with no matching event (e.g. orphan or race), that row would fail the NOT NULL constraint or FK. The migration only sets `event_id` where a matching event exists.
6. **Drops** `events.gig_id` (and its FK). After step 4, no code should rely on `events.gig_id`.
7. **Renames** `gigs` → `_deprecated_gigs`. **No drop.** Data remains for rollback.

**Rollback (if needed):** Restore from backup or reverse migration (rename `_deprecated_gigs` back to `gigs`, re-add `gig_id` columns and FKs, repopulate from mapping). Keep a copy of the gig_id → event_id mapping until you are confident.

**Post-migration:** If your app uses the DB function `create_draft_invoice_from_proposal(p_proposal_id)`, update it to set `event_id` (from the proposal’s `event_id`) on the new invoice row instead of `gig_id`. Invoices and proposals now reference `event_id`.

**Recommendation:** Run the migration in a staging environment first. Ensure no application code still reads `gigs` or `events.gig_id` before running in production.

---

## RLS verification (Policy 1 & 2)

After applying the migration:

- **Policy 1 (View):** `events_select_workspace` — Users can only `SELECT` events where `is_workspace_member(workspace_id)` is true. A user in Org/Workspace A cannot query an event from Workspace B by ID; RLS filters rows by `workspace_id` via the helper.
- **Policy 2 (Edit):** `events_update_workspace` — Users can `UPDATE` only if they are in the workspace **and** either (a) `is_workspace_owner(workspace_id)`, (b) `user_has_workspace_role(ARRAY['admin','owner'], workspace_id)`, or (c) they are assigned (`pm_id = auth.uid()` OR `producer_id = auth.uid()`).

**Manual check:** As a user in Workspace A, try to fetch an event that belongs to Workspace B by ID (e.g. via Supabase client). The query should return no row.
