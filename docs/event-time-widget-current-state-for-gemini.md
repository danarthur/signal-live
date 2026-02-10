# Event Time Widget – Current State (for Gemini / Elastic Time Widget)

**Purpose:** This doc describes what’s already built for the Event Command Center date/time experience so you can extend it instead of redoing it. The “Elastic Time Widget” / Time Capsule prompt overlaps heavily with existing work.

---

## 1. Where Things Live (No TimeCapsule Yet)

- **There is no** `src/widgets/event-dashboard/ui/logistics/TimeCapsule.tsx`.
- **Date & time UI lives in:** `src/widgets/event-dashboard/ui/EventCommandGrid.tsx`, inside the main form, in **Zone B** (“Date & time”).
- **Design:** Liquid Ceramic (LiquidPanel, `--glass-*` tokens). We use **date-fns** and **framer-motion** (via LiquidPanel). We do **not** use shadcn; we use **CeramicDatePicker** and a custom **TimeInput**.

---

## 2. State We Already Have (Equivalent to “Time Capsule” State)

| Gemini prompt concept | Our implementation |
|----------------------|--------------------|
| `showWindow: { start, end }` | Form fields: `start_date`, `start_time`, `end_date`, `end_time` (+ `set_by_time` to toggle time vs full-day). |
| `logisticsWindow: { loadIn, loadOut } \| null` | `show_load_in_out` (boolean) + `load_in_date`, `load_in_time`, `load_out_date`, `load_out_time`. Collapsible section “Show load-in / load-out”. |
| `isMultiDay` (calculated) | `multi_day` (boolean, user toggle). When false, `end_date` is synced to `start_date` and we use a single day (full 24h). |

**Full-day semantics (already in place):**

- When “Set by time” is **off**: start = `start_date` at **00:00:00**, end = **23:59:59.999** (single day uses `start_date`, multi-day uses `end_date`). So we already “span the full 24 hours of the date(s) selected.”

---

## 3. UI Layout We Already Have (“Sandwich” Equivalent)

- **Core layer (always visible):** Start date + (optional) start time; End date + (optional) end time. CeramicDatePicker for dates; custom TimeInput for times when “Set by time” is on.
- **Logistics layer (collapsible):** “Show load-in / load-out” checkbox; when on, we show Load-in date/time and Load-out date/time (same CeramicDatePicker + TimeInput pattern).
- **Toggles we have:** “Set by time”, “Military time (24h)”, “Multi-day event”, “Show load-in / load-out”.

So: **Guest-facing window** (start/end) vs **Production window** (load-in/load-out) is already separated and collapsible; we just use different labels (“Show load-in / load-out” vs “Add Production Schedule”).

---

## 4. What’s New in the Gemini Prompt and Worth Adding

These are **not** implemented yet and would improve the current widget:

1. **Guardrails: end before start**  
   Validate that end date/time is not before start date/time (and optionally load-in before show start, load-out after show end). Show a small error or block submit.

2. **Timezone note**  
   A small line like: “All times in local event time (PST)” or “Times in [resolved TZ]”. We currently don’t show timezone; adding it would match the prompt and reduce confusion.

3. **Summary display (optional but nice)**  
   A single line for the “main event”:
   - Multi-day: e.g. “Feb 10 – Feb 13”
   - Single day with time: e.g. “Feb 10, 3pm – 10pm”  
   Right now we only show the raw date pickers + time inputs; a read-only summary line would align with the “Core Layer” description in the prompt.

4. **Visualizer bar**  
   Prompt: “Gray Segment (Load In) → Brand Segment (Show) → Gray Segment (Load Out)”. We don’t have this. A small CSS bar (flex or grid segments) would give quick visual feedback on the relative length of load-in, show, load-out.

5. **Auto-set multi-day**  
   When the user picks an end **date** different from start date, we could auto-check “Multi-day event” (and maybe auto-uncheck when they set end date back to start). Right now multi-day is manual only.

---

## 5. What We Already Do Better or Differently

- **No `datetime-local`:** We use CeramicDatePicker (calendar dropdown) + TimeInput (text, 24h or 12h). Matches the “custom trigger + calendar + time” idea without building a new combo popover.
- **Military vs 12h:** We have a “Military time (24h)” toggle and full 12h AM/PM support; the prompt doesn’t mention this.
- **Full 24h of selected date:** We explicitly use start-of-day and end-of-day (23:59:59.999) when “Set by time” is off.
- **Already wired to `updateEventCommand`:** The form submit builds `starts_at`, `ends_at`, `dates_load_in`, `dates_load_out` (ISO strings) and calls `updateEventCommand(id, payload)` with revalidate and toast.

---

## 6. Recommended Direction for Gemini

- **Do not** re-implement the whole time widget from scratch. **Do** treat the existing Zone B in `EventCommandGrid.tsx` as the “Time Capsule” implementation.
- **Optional refactor:** Extract the date/time + load-in/load-out block into a component, e.g. `src/widgets/event-dashboard/ui/logistics/TimeCapsule.tsx`, that receives `control`, `register`, `watch` (or form values + callbacks) and still uses CeramicDatePicker + TimeInput. That would match the prompt’s component boundary without changing behavior.
- **Add on top of current behavior:**
  1. End ≥ start validation (and optionally load-in ≤ start, load-out ≥ end).
  2. Timezone note (e.g. “All times in local event time (PST)” or from `Intl`).
  3. Optional summary line (“Feb 10 – Feb 13” / “Feb 10, 3pm – 10pm”).
  4. Optional visualizer bar (Load In | Show | Load Out).
  5. Optional auto multi-day when end date ≠ start date.

**Key files to read before coding:**

- `src/widgets/event-dashboard/ui/EventCommandGrid.tsx` (Zone B, ~lines 407–616).
- `src/features/event-dashboard/actions/update-event.ts` (server action).
- `src/app/(dashboard)/(features)/crm/components/ceramic-date-picker.tsx` (date picker we use).
- Design: Liquid Ceramic in `src/shared/ui/liquid-panel.tsx` and globals (`--glass-*`).

---

## 7. One-Liner for Gemini

**Current state:** Event Command Center already has a full date/time + load-in/load-out widget in `EventCommandGrid` (Zone B): CeramicDatePicker + TimeInput, single/multi-day, full-day 00:00–23:59:59, collapsible production schedule, military/12h, wired to `updateEventCommand`. There is no separate `TimeCapsule.tsx` yet. **Add:** end-before-start guardrails, timezone note, optional summary line and visualizer bar; optionally extract Zone B into `TimeCapsule.tsx` and/or auto-set multi-day when end date ≠ start date.
