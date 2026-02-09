# Storage Path Protocol (Post Unification)

After the gigs/events unification, all file uploads and storage paths MUST follow this structure for tenant isolation and event-scoped organization.

## Path structure

```
/{workspace_id}/{event_id}/{module_name}/{filename}
```

- **workspace_id** – UUID of the workspace (tenant). Required for RLS and multi-tenancy.
- **event_id** – UUID of the event (unified events table). Use the event’s `id` for all event-related assets (contracts, proposals, run-of-show, finance).
- **module_name** – Logical module: e.g. `contracts`, `proposals`, `invoices`, `run_of_show`, `attachments`.
- **filename** – Original or sanitized file name (unique within the path).

## Examples

- Contract PDF: `{workspace_id}/{event_id}/contracts/signed-2025-02-09.pdf`
- Proposal attachment: `{workspace_id}/{event_id}/proposals/package-spec.pdf`
- Invoice attachment: `{workspace_id}/{event_id}/invoices/receipt-001.pdf`
- Run of show asset: `{workspace_id}/{event_id}/run_of_show/tech-rider.pdf`

## Implementation

1. **Supabase Storage bucket:** Create or use a bucket with RLS that restricts access by `workspace_id` (e.g. policy: user can read/write only paths where the first segment equals their workspace_id).
2. **Upload widgets:** When uploading for an event, pass `workspaceId` and `eventId` from the server (never trust client for tenant/event scope). Build path as above.
3. **Legacy paths:** Any paths that used `gig_id` should be migrated to `event_id`; the event id for a former gig is the unified event row’s `id` (from the migration mapping).

## Security

- Always resolve `workspace_id` and `event_id` server-side (e.g. from RLS-scoped query or session).
- Do not allow client-provided path segments for workspace or event.
- Storage RLS policies must enforce that users can only access paths under their workspace(s).
