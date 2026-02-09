# Gigs vs Events (Supabase)

Summary of how **gigs** and **events** are used in the codebase and whether both are needed. (Direct DB introspection wasn’t possible; this is inferred from code and `src/types/supabase.ts`.)

---

## 1. Where each table is used

| Table   | Used by | Main columns (from code) |
|--------|---------|---------------------------|
| **events** | Calendar (`get-events`, `get-event-details`), Events API route | `id`, `title`, `starts_at`, `ends_at`, `status`, `location_name`, `workspace_id`, `project_id` → projects |
| **gigs**   | CRM page, `useCRM`, Active Production widget, finance-sync (invoices), Run of Show (`run_of_show_cues.gig_id`) | `id`, `title`, `status`, `event_date`, `event_location`/`location`, `client` → clients, `budget_estimated`, `workspace_id` |

---

## 2. Purpose of each

### Events (public.events)

- **Role:** Calendar / scheduling.
- **Meaning:** “Something that happens at a specific time range.”
- **Shape:** Start + end (`starts_at`, `ends_at`), scheduling status (`confirmed` | `hold` | `cancelled` | `planned`), optional `project_id`, `location_name`, `workspace_id`.
- **Used for:** Month/week/day views, event detail blade, “upcoming events” API. Tied to **projects**, not clients.

### Gigs (public.gigs)

- **Role:** Deal / production pipeline (CRM).
- **Meaning:** “A production job from first contact to completion.”
- **Shape:** Single date (`event_date`), location, **client** (FK to clients), **status** = pipeline stage (`inquiry` | `proposal` | `contract_sent` | `confirmed` | `run_of_show` | `archived`), `budget_estimated`, `workspace_id`.
- **Used for:** Production queue (CRM), Active Production widget, Run of Show (cues are per **gig** via `run_of_show_cues.gig_id`), and finance (invoices can reference `gig_id`).

---

## 3. Differences (short)

| Aspect        | Events                    | Gigs                          |
|---------------|---------------------------|-------------------------------|
| **Focus**     | When something happens    | A production/deal lifecycle   |
| **Time**      | Start + end (range)        | Single date (`event_date`)    |
| **Status**    | Scheduling (confirmed/hold/cancelled/planned) | Pipeline (inquiry → archived) |
| **Relation**  | → projects                | → clients                     |
| **UI**        | Calendar, event detail    | CRM, production queue, ROS    |
| **Other**     | —                         | Run of Show cues, invoices    |

So: **events** = calendar slots; **gigs** = productions/deals with a pipeline and client.

---

## 4. Do we need both?

**Yes.** They serve different purposes:

- **Events** answer: “What’s on the calendar when?” (scheduling, projects).
- **Gigs** answer: “What productions are we selling/doing?” (CRM, client, budget, run of show, finance).

You could **link** them (e.g. when a gig is confirmed, create one or more **events** for that gig, and optionally add `gig_id` on `events`). Right now the app does not do that: events are tied to projects; gigs are tied to clients and run-of-show. So both tables are needed unless you deliberately collapse one concept into the other (e.g. “only gigs, no events” or “only events, no gigs”), which would be a product/UX change.

---

## 5. Note on types

`src/types/supabase.ts` does **not** define `gigs` or `events`; it only has `profiles`, `workspaces`, `workspace_members`, `locations`, `run_of_show_cues`. So the DB likely has more tables than the types file. Keeping the types in sync (e.g. via Supabase codegen) would make the above column lists authoritative.
