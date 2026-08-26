# Backend Gaps — Collections Review Portal (V2 Demo)

This document maps every UI element in the V2 demo (`/demo`) to the backend endpoint or
model field it would need in production. Originally written against the real Flask backend
at the time of the demo commit (June 2026).

**Re-verified 2026-08-26** against a live local backend: frontend built without
`VITE_DEMO_MODE`, SQLite seeded with a two-queue project and mixed decisions, Flask on
:5000, every endpoint below exercised with real requests. Rows corrected by that pass are
marked **[verified 2026-08-26]**. Four claims in the June version were stale — three of
them in our favour. See "Corrections" in the summary.

**Legend**
- **yes** — endpoint/field exists and the response shape already matches what the UI expects
- **partial** — endpoint/field exists but needs a small change (field rename, additional
  include, or relaxed gate) before the frontend can consume it directly
- **no** — nothing in the backend serves this today
- **unverified** — could not confirm from code inspection alone; needs a live-data test

---

## Summary — start here

### The headline

**This is an integration project, not a backend project.** The backend is roughly 90%
ready. The work is on the frontend.

The V2 demo screens have **no data layer at all**. None of the 13 components in
`frontend/src/features/collections-review-demo/` imports the API client, `axios`, or
`fetch` — verified by grep. They read and write `mockStore.js` (211 lines of in-memory
Svelte stores) and `mockData.js`. All nine write functions (`decideSource`,
`redecideCurrentSource`, `proposeSource`, `changeDecision`, `saveGuidelines`,
`saveSourceMeta`, `addProject`, `downloadCSV`, `navigateToSource`) mutate client state
and nothing else.

They are also unreachable without the build flag. Every `/demo/*` branch in
`App.svelte` is guarded by `&& DEMO_ON` (`import.meta.env.VITE_DEMO_MODE === 'true'`),
and there is no non-demo route to any V2 screen. Build without the flag and every
`/demo` path falls through to the final `{:else}` → `RootStatic`, returning HTTP 200
the whole time. A 200 from `/demo` proves nothing about whether the screens are live.

### Screen-by-screen state

| Screen | Component | Data layer today | Backend ready? |
|---|---|---|---|
| 1 — Manage | `DemoHome` | mock only | **yes** — all endpoints exist |
| 2 — Project Admin | `DemoProject` | mock only | **yes** — all endpoints exist |
| 3 — Queue Landing | `DemoQueueLanding` | mock only | **yes** — incl. sibling-queue data (2 calls) |
| 4 — Review | `DemoReview` | mock only | **mostly** — 3 gaps, see below |
| 5 — Decisions | `DemoDecisions` | mock only | **yes** — 5 bucket endpoints exist |

41 routes exist on the `api_bp` blueprint. Every endpoint these five screens need
returned 200 against seeded data.

### The three real backend gaps

1. **Keep reasons have nowhere to be stored.** The reason modal in `DemoReview` collects
   a reason for both Keep and Remove, but only `removal_reason` (remove) and `skip_note`
   (skip) columns exist. `POST .../decide {"decision":"keep","removal_reason":"…"}`
   returns 200 and stores `removal_reason: null` — the value is silently discarded.
   *Needs: a column on `ReviewItem` (e.g. `keep_reason`) plus a migration, or an agreed
   decision to drop keep rationales from the UI.*
2. **Propose-new-source is blocked by the metadata gate.** `POST /api/review-queues/
   <guid>/items` with only `{source_label, source_homepage}` returns **400**: "When
   metadata editing is enabled, primary_language, pub_country, and pub_state are
   required." The demo form collects only label and URL, so the flow fails against any
   project with `edit_metadata=true`. *Needs: three fields added to the propose form, or
   the gate relaxed for proposed sources.*
3. **Per-field "Correct" confirmation has no storage.** No `confirmed`-anything column
   exists on `ReviewItem`. *Needs: a `confirmed_metadata_fields` JSON column, or adopt
   the no-op-PATCH workaround (see Screen 4), which requires no backend change.*

Gaps 1 and 2 were both recorded as "yes / no change needed" in the June version. They are
not.

### Frontend work beyond wiring

- **Missing route.** `App.svelte` has no `/review-queues/<guid>` route, so the per-queue
  reviewer links the Project Admin screen copies do not resolve. No backend work needed.
- **Stats key adapter.** Backend returns `keep`/`remove`/`add`/`skip`; the UI wants
  `kept`/`removed`/`added`/`skipped`. Pure frontend mapping, applies to every roll-up.
- **Queue display label.** Backend stores `queue_index` (0-based int); derive
  `Queue #${queue_index + 1}` client-side.
- **Markdown rendering.** `GET .../guidelines` returns `{ "guidelines": "<markdown>" }`.
  Needs a renderer plus sanitiser (`marked` + DOMPurify).

### Corrections to the June version

| # | June claim | Actual state (2026-08-26) |
|---|---|---|
| 1 | Screen 3 sibling-queue grid: **no** — queue exposes only `review_project_id` | **Solvable, no backend change.** `GET /api/review-queues/<guid>` returns `review_project_guid`; follow it to `GET /api/review-projects/<guid>` for `queues[]` with per-queue `stats`. Two calls |
| 2 | `source_metadata` is a raw JSON string the frontend must parse | **Already parsed.** The API returns it as a JSON object |
| 3 | `removal_reason` is optional/nullable on decide | **Required.** `{"decision":"remove"}` without it returns 400. The demo's reason modal already satisfies this |
| 4 | Screen 5 (`DemoDecisions`) not documented | **Fully served** by `all-queue-items` + `kept/removed/added/skipped-items` |

### Untested — do not assume these work

Both were out of reach locally because `MEDIACLOUD_API_KEY` is unset:

- **Real queue generation.** `POST /api/review-projects/<guid>/queues` fetches sources
  from MediaCloud collections and populates the `ReviewProjectSource` table. The
  2026-08-26 pass seeded `Review`/`ReviewItem` rows directly and bypassed it, so
  `ReviewProjectSource` was empty and `sources_total` read 0. That is a seed artifact,
  not a bug — project `stats` aggregate correctly from queues once queues exist, and
  `sources_total` only feeds the "pending, no queues yet" state. **The real generation
  path is unverified end to end.**
- **Publish endpoints.** `POST /api/review-projects/<guid>/publish/preview` and
  `/publish` both talk to the MediaCloud write API. Never exercised. The demo does not
  surface publish at all, so this is out of scope for wiring the five screens but in
  scope before production.

Also unverified: reviewer auth. Every `/api/review-queues/<guid>/*` endpoint is publicly
accessible; the GUID is obscurity, not access control. See "Reviewer auth-by-link" below.
Note that solving Screen 3's sibling-queue grid via `GET /api/review-projects/<guid>`
means a reviewer holding one queue GUID reads project-wide data — no new exposure, since
that endpoint is already public, but worth a deliberate decision.

---

## Screen 1 — Manage (DemoHome)

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| Hero stat: "N projects" | `allProjects.length` from project list | `GET /api/review-projects` → array length | None — client counts the array |
| Hero stat: "N active queues" | Count of queues with `status !== 'completed'` | `GET /api/review-projects` → each project's `queues[]` | None — derived client-side from the same call |
| QuickReviewCard — enter collection ID / start | `POST /api/review-projects/start` body `{ collection_ids, name }` | **yes** — `POST /api/review-projects/start` | None |
| Projects table — name, seeds count, queue count, % progress | `{ name, seeds, queues, progress }` per project | **partial** — `GET /api/review-projects` returns the project and its queues array; `collection_names_json` carries the seed list; `stats` carries decision counts | Frontend must derive `seeds` from `collection_names_json.length`, `queues` from `queues[].length`, and `progress` from `stats.keep + stats.add + stats.remove) / stats.total` |
| Projects table — decision roll-up bar | `{ kept, removed, added, skipped, undecided }` | **partial** — same `GET /api/review-projects` `stats` block uses keys `keep`/`remove`/`add`/`skip`/`undecided`/`total` | Rename display mapping: `keep→kept`, `remove→removed`, `add→added`, `skip→skipped` (frontend adapter, no backend change required) |
| In-progress cards (legacy reviews) | `[{ n, id, p }]` | **yes** — `GET /api/reviews/in-progress` returns non-project reviews with `collection_id` and stats | Frontend derives `p` from `stats` |
| Completed cards (legacy reviews) | `[{ n, when }]` | **yes** — `GET /api/reviews/completed` returns completed reviews with `updated_at` | None |

---

## Screen 2 — Project Admin (DemoProject)

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| Project name (editable inline) | `PATCH /api/review-projects/<guid>/name` `{ name }` | **yes** | None |
| Project decision roll-up bar | `{ kept, removed, added, skipped, undecided }` aggregated across all queues | **partial** — `GET /api/review-projects/<guid>` returns `stats` with `keep`/`remove`/`add`/`skip`/`undecided` keys | Same key rename as Screen 1 — frontend adapter only |
| **Project CSV export** | Download of `GET /api/review-projects/<guid>/export` | **yes** — returns KEEP + ADD union in MediaCloud CSV format | None |
| **Audit CSV export** | Download of `GET /api/review-projects/<guid>/export/audit` | **yes** — full audit CSV: all decisions + `removal_reason` + `skip_note` + reviewer queue index | None |
| Seed collections strip | `project.seed` array of collection names | **yes** — `collection_names_json` on `ReviewProject`; returned in `GET /api/review-projects/<guid>` as `collection_names` array | None |
| Queue cards — name, done/total, progress | `{ id, total, done, kept, removed, ... }` per queue | **partial** — `GET /api/review-projects/<guid>` includes `queues[]` each with `stats` sub-object; queue `name`/`id` comes from `collection_name` on the `Review` row | Frontend maps `stats.keep→kept` etc.; `queue.id` in demo is a string like "Queue #1" — real backend stores `queue_index` (integer) and `collection_name`; UI needs to synthesise label |
| **Queue "Copy link" button** | Shareable URL for the reviewer | **partial** — `GET /api/review-projects/<guid>` returns each queue's `queue_guid`; URL is assembled client-side as `<origin>/review-queues/<queue_guid>` | No new endpoint needed. The existing prod frontend already does this (README §Features). However, App.svelte does not yet have a `/review-queues/<guid>` route pointing at the Queue Landing screen — that route must be added for the link to resolve |
| Queue "Open landing" action | Navigates to `/review-queues/<queue_guid>` | **no (frontend route missing)** — the API data exists but App.svelte has no `/review-queues/<guid>` → `<QueueLanding>` route | Add `{:else if currentPath.match(/^\/review-queues\/[0-9a-fA-F-]+$/)} <DemoQueueLanding … />` (or production equivalent) to App.svelte, reading the guid from the URL |
| Queue status chips (Completed / Unassigned / In progress) | Derived from `done === total`, `done === 0` | **yes** — computed from `stats` in the queue list | None — derived client-side |
| **Settings modal — guidelines text (edit)** | `GET`/`PATCH /api/review-projects/<guid>/guidelines` `{ markdown }` | **yes** — full CRUD; stored in `ReviewProject.guidelines_custom_markdown`; templates in `backend/templates/guidelines/*.md` | None |
| Settings — "Edit source metadata in queues" toggle | `PATCH /api/review-projects/<guid>/edit-metadata` `{ edit_metadata: bool }` | **yes** — propagates to all child queues | None |
| Settings — virtual queue links toggle | `PATCH /api/review-projects/<guid>/reviewer-landing-virtual-queues` | **yes** | None |

---

## Screen 3 — Queue Landing (DemoQueueLanding)

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| "You've been invited to review Queue #N" hero | Queue name + total source count from `GET /api/review-queues/<queue_guid>` | **partial** — endpoint exists and returns the queue object; `queue_index` (0-based int) is stored but no human-readable `Queue #N` label is stored | Backend should store or derive a display name. Simplest: return `"Queue #\(queue_index + 1)"` from the endpoint (one-line change in `to_dict`) |
| Chips: "N sources assigned", "Project: …" | `total` from queue stats; `review_project.name` | **partial** — `GET /api/review-queues/<guid>` returns `total` via `stats`; does NOT currently return the parent project name | Add project name to the queue's `to_dict()` response, or add a `project_name` field via a JOIN/lookup in the route handler |
| **About this project / guidelines copy** | Rendered Markdown from `GET /api/review-queues/<guid>/guidelines` | **yes** — endpoint exists; inherits from parent project's `guidelines_custom_markdown` or renders the template | Frontend must fetch and render the Markdown (e.g. with `marked` or a simple `<article>` with innerHTML after sanitisation) |
| Progress bar — `{ kept, removed, added, skipped, undecided }` | Same decision counts as above | **partial** — `GET /api/review-queues/<guid>` returns `stats` with `keep`/`remove` keys | Same key rename in frontend adapter |
| Decision browse tiles — Kept N / Removed N / Added N / Skipped N | Decision counts from queue stats | **partial** — key rename only | Same |
| "Open my queue" button | First undecided item: `GET /api/review-queues/<guid>/items?decision=undecided&page=1&page_size=1` | **yes** | None |
| "Review all decisions" button | `GET /api/review-queues/<guid>/items` | **yes** | None |
| **Project status card — per-queue done/total grid** | All sibling queues' `{ id, done, total, status }` | **yes, via two calls** — **[verified 2026-08-26]** `GET /api/review-queues/<guid>` returns `review_project_guid` (alongside `review_project_id`, `edit_metadata`, `stats`, `queue_index`, `undecided_count`). Follow it to `GET /api/review-projects/<guid>`, whose envelope carries `queues[]` with per-queue `stats` | No backend change. Frontend makes the second call and maps `stats.keep→kept` etc. Was recorded as **no** in the June version — the queue endpoint did not expose the project GUID then. Note this means a reviewer holding one queue GUID reads project-wide data; that endpoint is already public, so no new exposure, but decide deliberately |
| **Reviewer auth — "no account needed"** | Unauthenticated access scoped to one queue_guid | **partial** — all `/api/review-queues/<guid>/*` endpoints are publicly accessible today; the GUID acts as a pseudo-secret. Any request with a valid queue_guid can read and write decisions | For a public beta this is acceptable. For production with sensitive data: add HMAC-signed tokens at queue-generation time (`POST /api/review-projects/<guid>/queues` mints a token per queue), validate token on every reviewer request. No auth infrastructure exists today |

---

## Screen 4 — Review (DemoReview)

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| Source title (44 px heading) | `source_label` from `GET /api/review-queues/<guid>/items/<item_id>` | **yes** — `ReviewItem.source_label` | None |
| Source homepage link | `source_homepage` | **yes** — `ReviewItem.source_homepage` | None |
| "New source" chip | `is_new_source: true` | **yes** — `ReviewItem.is_new_source` | None |
| "Local · Daily" chip / source type | `media_type` from `source_metadata` | **yes** — **[verified 2026-08-26]** stored as JSON text on `ReviewItem.source_metadata`, but the API returns it **already parsed as a JSON object**, not a string | Frontend maps `media_type` to a display label. No parsing needed — the June version's "frontend must parse" is stale |
| Progress counter (124 / 200, 62%) | `done` and `total` from queue stats | **yes** — available in `GET /api/review-queues/<guid>` stats | None |
| Prev / Next navigation | `GET /api/review-queues/<guid>/items` paginated; item ordering by `id` | **yes** — pagination exists via `page`/`page_size` params | Frontend must track current page index; "Prev" decrements, "Next" increments |
| Back to queue | Navigates to Queue Landing | **yes (routing only)** | Requires the `/review-queues/<guid>` frontend route (see Screen 3 gap above) |
| **Source metadata grid — Language / Pub country / Pub state** | `primary_language`, `pub_country`, `pub_state` from `source_metadata` | **yes** — stored in `ReviewItem.source_metadata` JSON | Frontend reads `source_metadata.primary_language`, `.pub_country`, `.pub_state` |
| **"Correct" checkbox per metadata field** | Per-field confirmation state | **no** — no `confirmed_fields` flag or equivalent exists in the backend. `source_metadata` is an opaque JSON blob with no per-field confirmation tracking | Either (a) add a `confirmed_metadata_fields` JSON column to `ReviewItem`, or (b) treat clicking "Correct" as a no-op write (PATCH the same value back) and rely on the decided_at timestamp as implicit confirmation. Option (b) requires no backend change |
| **"Edit" button — metadata write path** | `PATCH /api/review-queues/<guid>/items/<item_id>/source-metadata` `{ primary_language, pub_country, pub_state }` | **yes** — endpoint exists | Requires `edit_metadata=true` on the parent `ReviewProject` (or `Review`). Gate must be checked by the frontend before showing the Edit button |
| Decision dock — **Keep** | `POST /api/review-queues/<guid>/items/<item_id>/decide` `{ decision: "keep" }` | **yes** | None |
| Decision dock — **Remove** | Same endpoint, `{ decision: "remove", removal_reason: "…" }` | **yes** — **[verified 2026-08-26]** `removal_reason` is **required**, not optional: `{"decision":"remove"}` without it returns `400 removal_reason is required when decision is "remove"` | None. The demo now prompts via the Keep/Remove reason modal, so this is already satisfied. The June version described it as nullable/optional — incorrect |
| Decision dock — **Keep reason** | Reason modal collects a rationale for Keep as well as Remove | **no** — **[verified 2026-08-26]** there is nowhere to put it. `ReviewItem` has only `removal_reason` and `skip_note`. `POST .../decide {"decision":"keep","removal_reason":"…"}` returns **200** and stores `removal_reason: null` — the value is **silently discarded**, no error | Add a `keep_reason` column to `ReviewItem` (+ migration) and persist it in `_apply_review_item_decision_fields`, or drop the Keep reason from the UI. Silent data loss until then |
| Decision dock — **Skip** | Same endpoint, `{ decision: "skip", skip_note: "…" }` | **yes** — `skip_note` is optional | None |
| Keyboard shortcuts (K / R / S) | Frontend keydown listener only | **frontend-only** | No backend change needed |
| **"Propose new source" button** | `POST /api/review-queues/<guid>/items` `{ source_label, source_homepage }` | **partial** — **[verified 2026-08-26]** endpoint exists and creates a `ReviewItem` with `is_new_source=true`, but when the effective `edit_metadata` is true it **rejects the demo's payload with 400**: "When metadata editing is enabled, primary_language, pub_country, and pub_state are required." With all three fields it returns 201 | The demo form collects only label + URL (`proposeSource(label, homepage)`), so this flow fails against any project with `edit_metadata=true`. Either add the three metadata fields to the propose form, or relax the gate for proposed sources. The June version recorded this as **yes / None** — incorrect |
| "All decisions · N" count | Total decided items: `stats.total - stats.undecided` | **yes** — derived from queue stats | None |
| Guidelines sidebar | `GET /api/review-queues/<guid>/guidelines` Markdown | **yes** | Frontend must render the Markdown |
| Status sidebar — kept/removed/skipped/added counts | Same queue stats | **partial** — key rename (`keep→kept` etc.) | Frontend adapter only |

---

## Screen 5 — Decisions list (DemoDecisions)

Not covered by the June version. Added **[verified 2026-08-26]** — every endpoint below
returned 200 against seeded data. This screen is fully served by the existing backend.

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| All decisions across the project | Flat list of every item with its decision | **yes** — `GET /api/review-projects/<guid>/all-queue-items` | Key rename only |
| "Kept" bucket | Items with `decision = keep` | **yes** — `GET /api/review-projects/<guid>/kept-items` | None |
| "Removed" bucket | Items with `decision = remove` + `removal_reason` | **yes** — `GET /api/review-projects/<guid>/removed-items` | None |
| "Added" bucket | Items with `is_new_source = true` / `decision = add` | **yes** — `GET /api/review-projects/<guid>/added-items` | None |
| "Skipped" bucket | Items with `decision = skip` + `skip_note` | **yes** — `GET /api/review-projects/<guid>/skipped-items` | None |
| Change a decision inline | Re-decide an already-decided item | **yes** — re-`POST /api/review-queues/<guid>/items/<item_id>/decide` is idempotent and updates in place | Frontend needs the item's `queue_guid`, which the bucket endpoints return alongside each item |
| Reason shown next to a changed decision | Reason text per decision | **partial** — `removal_reason` and `skip_note` come back on each item; a **Keep** reason has nowhere to be stored (see Screen 4) | Same as Screen 4 gap 1 |

Pagination and dedup differ across the five, which matters for counts shown in the UI:

| Endpoint | Default `page_size` | `dedupe_source_id` |
|---|---|---|
| `all-queue-items` | 500 (max 8000) | **not supported** |
| `kept-items` / `removed-items` / `added-items` / `skipped-items` | 100 | supported, **defaults to `true`** |

The four bucket endpoints deduplicate by `source_id` unless you explicitly pass
`dedupe_source_id=false`, so their `total` can be lower than the raw item count and lower
than the matching figure in `stats`. Don't cross-check one against the other without
accounting for this.

---

## Specific items called out

### Per-queue shareable reviewer links

The shareable URL is `<origin>/review-queues/<queue_guid>`. The `queue_guid` is generated at
queue-creation time (`POST /api/review-projects/<guid>/queues`) and stored on the `Review`
row. It is already returned by `GET /api/review-projects/<guid>` in the `queues[]` array.
The existing (non-demo) frontend already assembles and copies this URL to the clipboard.

**No new backend endpoint is needed.** The gap is a missing frontend route: App.svelte must
route `/review-queues/<guid>` to the Queue Landing component so that the copied link
actually resolves.

### "Copy reviewer link" — is there a mint endpoint?

No. The GUID is minted once at queue generation and lives on the `Review.queue_guid` column.
The frontend constructs the full URL client-side. No dedicated link-minting endpoint is
needed or expected.

### Project-level decision roll-ups

**Exist.** `GET /api/review-projects/<guid>` returns a `stats` block aggregated across all
queues: `{ total, keep, remove, add, undecided, skip }`. Per-queue stats are also returned
in `queues[].stats`.

**[verified 2026-08-26]** Note the envelope shape — `stats` and `queues` are **siblings of
`project`, not nested inside it**. Easy to miss when wiring:

```
{ project: {…}, stats: {…}, queues: [ {…, stats: {…}} ],
  collections_count, sources_total, derived_status,
  publish_enabled, publish_metadata_updates_enabled, publish_target_api_base_url }
```

`stats` aggregates from the queues whenever queues exist. The `sources_total`-derived
fallback (`total`/`undecided` = source count, everything else 0) applies only to the
"pending, no queues yet" state.

The only integration work is a key rename in the frontend adapter (`keep→kept`, `remove→removed`,
`add→added`, `skip→skipped`) — no backend change required.

### CSV export variants

| Export | Endpoint | Status |
|---|---|---|
| Project CSV (KEEP + ADD union) | `GET /api/review-projects/<guid>/export` | **yes** |
| Audit CSV (all decisions + notes + queue index) | `GET /api/review-projects/<guid>/export/audit` | **yes** |
| Legacy single-review CSV | `GET /api/reviews/<id>/export` | **yes** |
| Legacy removed-only CSV | `GET /api/reviews/<id>/export/removed` | **yes** |
| Legacy added-only CSV | `GET /api/reviews/<id>/export/added` | **yes** |

Both export types the demo surfaces already exist.

### "Add new source" / propose-source flow

**Exists, but the demo's payload is rejected.** **[verified 2026-08-26]**
`POST /api/review-queues/<guid>/items` creates a new `ReviewItem` with
`is_new_source=true`, and the backend deduplicates proposed sources across the entire
project (checks all queues for the same `source_homepage`).

However, when the effective `edit_metadata` is true the handler requires
`primary_language`, `pub_country` and `pub_state` as well:

```
POST {"source_label":"…","source_homepage":"…"}                        → 400
POST {…, "primary_language":"en","pub_country":"USA","pub_state":"US-MD"} → 201
```

The demo collects only label and URL, so this flow fails against any project with
metadata editing on. This is backend gap 2 in the summary.

### "About this project" / guidelines copy — stored where?

Stored in two columns on `ReviewProject`:
- `guidelines_template` (String, default `"default"`) — references a Markdown template in `backend/templates/guidelines/*.md`
- `guidelines_custom_markdown` (Text, nullable) — final Markdown text if the manager has customized it

`GET /api/review-queues/<guid>/guidelines` returns the rendered Markdown (custom if set,
otherwise the template rendered with project context). The frontend must fetch this and
render it — `marked` + DOMPurify is the standard combo.

### Source metadata editing — write path

**Exists.** `PATCH /api/review-queues/<guid>/items/<item_id>/source-metadata` accepts
`{ primary_language, pub_country, pub_state }`. It returns the updated item.

Two conditions must be met:
1. `edit_metadata` must be `true` on the parent `ReviewProject` (set by the manager via
   `PATCH /api/review-projects/<guid>/edit-metadata`).
2. The frontend must check `queue.edit_metadata` before showing Edit buttons.

There is currently no per-field "confirmed correct" write path — see the "Correct checkbox"
row in Screen 4 above.

### Reviewer auth-by-link — does the backend support tokenized access?

**No.** All `/api/review-queues/<guid>/*` endpoints are publicly accessible with no
authentication middleware. Anyone who knows a queue GUID can read and submit decisions.
The GUID (UUID v4) provides obscurity but not access control.

The current model is consistent with the demo's "No account needed; your progress saves
automatically" copy — it is intentional for an MVP. For a hardened deployment:

1. At queue-generation time, mint a per-queue HMAC token (or a signed JWT) and return it
   to the manager alongside the queue URL.
2. Reviewers carry the token in the URL fragment or a cookie.
3. Backend middleware validates the token before allowing writes to that queue.

No infrastructure for this exists in the backend today.

---

## Frontend-only for demo (no backend work expected)

The following elements are fully implemented in the frontend and do not require any new
backend endpoints, fields, or changes:

- **Glass nav** — pure CSS `backdrop-filter`; no data
- **QuickReviewCard typing animation** — pure frontend timeout chain; no data
- **Demo navigation pill** (bottom-right) — frontend routing only; removed before production
- **DecisionBar segment colors and hover-highlight** — computed from decision counts; no new backend fields
- **Progress percentages** — derived client-side from `done / total`
- **Keyboard shortcuts** (K / R / S in decision dock) — frontend `keydown` listener only
- **"Review in Media Cloud" link** — URL constructed from `MEDIACLOUD_SEARCH_BASE_URL` env var (already documented)
- **"Completed" / "Unassigned" / "In progress" queue status chips** — derived from `done` and `total`; no new fields
- **Guidelines sidebar text formatting** — frontend renders Markdown that the backend already stores; no new endpoints
- **Status sidebar cell colors** — derived from decision type; no new data
- **All CSS design tokens (`--v2-*`)** — scoped to `.demo-root`; no backend involvement
