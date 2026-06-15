# Backend Gaps — Collections Review Portal (V2 Demo)

This document maps every UI element in the V2 demo (`/demo`) to the backend endpoint or
model field it would need in production. Written against the real Flask backend at the time
of the demo commit (June 2026).

**Legend**
- **yes** — endpoint/field exists and the response shape already matches what the UI expects
- **partial** — endpoint/field exists but needs a small change (field rename, additional
  include, or relaxed gate) before the frontend can consume it directly
- **no** — nothing in the backend serves this today
- **unverified** — could not confirm from code inspection alone; needs a live-data test

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
| **Project status card — per-queue done/total grid** | All sibling queues' `{ id, done, total, status }` | **no** — `GET /api/review-queues/<guid>` returns only the single queue; it does not expose sibling queue data. The queue object includes `review_project_id` (integer PK) but not the project GUID | Add one of: (a) a `project` sub-object to the queue endpoint response that includes sibling queue summaries; or (b) expose `GET /api/review-queues/<guid>/project` that returns the parent project's per-queue stats |
| **Reviewer auth — "no account needed"** | Unauthenticated access scoped to one queue_guid | **partial** — all `/api/review-queues/<guid>/*` endpoints are publicly accessible today; the GUID acts as a pseudo-secret. Any request with a valid queue_guid can read and write decisions | For a public beta this is acceptable. For production with sensitive data: add HMAC-signed tokens at queue-generation time (`POST /api/review-projects/<guid>/queues` mints a token per queue), validate token on every reviewer request. No auth infrastructure exists today |

---

## Screen 4 — Review (DemoReview)

| UI element | Data / shape the frontend expects | Real endpoint / field today | What would need to change |
|---|---|---|---|
| Source title (44 px heading) | `source_label` from `GET /api/review-queues/<guid>/items/<item_id>` | **yes** — `ReviewItem.source_label` | None |
| Source homepage link | `source_homepage` | **yes** — `ReviewItem.source_homepage` | None |
| "New source" chip | `is_new_source: true` | **yes** — `ReviewItem.is_new_source` | None |
| "Local · Daily" chip / source type | `media_type` from `source_metadata` JSON blob | **yes** — stored in `ReviewItem.source_metadata` as JSON; key is `media_type` | Frontend must parse `source_metadata` JSON and map `media_type` to a display label |
| Progress counter (124 / 200, 62%) | `done` and `total` from queue stats | **yes** — available in `GET /api/review-queues/<guid>` stats | None |
| Prev / Next navigation | `GET /api/review-queues/<guid>/items` paginated; item ordering by `id` | **yes** — pagination exists via `page`/`page_size` params | Frontend must track current page index; "Prev" decrements, "Next" increments |
| Back to queue | Navigates to Queue Landing | **yes (routing only)** | Requires the `/review-queues/<guid>` frontend route (see Screen 3 gap above) |
| **Source metadata grid — Language / Pub country / Pub state** | `primary_language`, `pub_country`, `pub_state` from `source_metadata` | **yes** — stored in `ReviewItem.source_metadata` JSON | Frontend reads `source_metadata.primary_language`, `.pub_country`, `.pub_state` |
| **"Correct" checkbox per metadata field** | Per-field confirmation state | **no** — no `confirmed_fields` flag or equivalent exists in the backend. `source_metadata` is an opaque JSON blob with no per-field confirmation tracking | Either (a) add a `confirmed_metadata_fields` JSON column to `ReviewItem`, or (b) treat clicking "Correct" as a no-op write (PATCH the same value back) and rely on the decided_at timestamp as implicit confirmation. Option (b) requires no backend change |
| **"Edit" button — metadata write path** | `PATCH /api/review-queues/<guid>/items/<item_id>/source-metadata` `{ primary_language, pub_country, pub_state }` | **yes** — endpoint exists | Requires `edit_metadata=true` on the parent `ReviewProject` (or `Review`). Gate must be checked by the frontend before showing the Edit button |
| Decision dock — **Keep** | `POST /api/review-queues/<guid>/items/<item_id>/decide` `{ decision: "keep" }` | **yes** | None |
| Decision dock — **Remove** | Same endpoint, `{ decision: "remove", removal_reason: "…" }` | **yes** — `removal_reason` is stored; it is not currently required by the API (nullable), but the README says it's optional | Demo doesn't prompt for a reason; production should add a modal or text field for removal_reason |
| Decision dock — **Skip** | Same endpoint, `{ decision: "skip", skip_note: "…" }` | **yes** — `skip_note` is optional | None |
| Keyboard shortcuts (K / R / S) | Frontend keydown listener only | **frontend-only** | No backend change needed |
| **"Propose new source" button** | `POST /api/review-queues/<guid>/items` `{ source_label, source_homepage }` | **yes** — creates a `ReviewItem` with `is_new_source=true` | None |
| "All decisions · N" count | Total decided items: `stats.total - stats.undecided` | **yes** — derived from queue stats | None |
| Guidelines sidebar | `GET /api/review-queues/<guid>/guidelines` Markdown | **yes** | Frontend must render the Markdown |
| Status sidebar — kept/removed/skipped/added counts | Same queue stats | **partial** — key rename (`keep→kept` etc.) | Frontend adapter only |

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

**Exists.** `POST /api/review-queues/<guid>/items` with `{ source_label, source_homepage }`
creates a new `ReviewItem` with `is_new_source=true`. The backend deduplicates proposed
sources across the entire project (checks all queues for the same `source_homepage`).

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
