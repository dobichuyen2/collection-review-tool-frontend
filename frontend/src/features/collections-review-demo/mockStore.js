import { writable, derived, get } from 'svelte/store';
import { PROJECTS } from './mockData.js';

// ── Queue sources for the live demo session (proj_8fa221 / q1) ───────────
// These 6 sources are distinct from the 7 background sources already in Q1's
// decisions array, so the live reviewer is deciding fresh sources.
export const QUEUE_SOURCES = [
  { id: 'src_001', title: 'The Capital Gazette',  homepage: 'capitalgazette.com',     isNew: false, language: 'English', country: 'United States', state: 'Maryland',      mediaType: 'Local · Daily'       },
  { id: 'src_002', title: 'Baltimore Banner',      homepage: 'thebaltimorebanner.com', isNew: false, language: 'English', country: 'United States', state: 'Maryland',      mediaType: 'Non-profit · Online' },
  { id: 'src_003', title: 'Delaware Online',       homepage: 'delawareonline.com',     isNew: false, language: 'English', country: 'United States', state: 'Delaware',      mediaType: 'Local · Daily'       },
  { id: 'src_004', title: 'WTOP News',             homepage: 'wtop.com',               isNew: false, language: 'English', country: 'United States', state: 'Washington DC', mediaType: 'Radio · Online'      },
  { id: 'src_005', title: 'Virginia Mercury',      homepage: 'virginiamercury.com',    isNew: false, language: 'English', country: 'United States', state: 'Virginia',      mediaType: 'Non-profit · Online' },
  { id: 'src_006', title: 'Washington City Paper', homepage: 'washingtoncitypaper.com',isNew: true,  language: 'English', country: 'United States', state: 'Washington DC', mediaType: 'Alt-Weekly'          },
];

export const GUIDELINES_DEFAULT =
`## Review guidelines

**Keep** sources that do original local reporting at least weekly.

**Remove** aggregators, syndicate-only mirrors, and defunct sites.

**Skip** when you're unsure — leave a note for the lead reviewer.`;

// ── Master decisions store ────────────────────────────────────────────────
// Shape: { [projectGuid]: { [queueId]: Array<DecisionEntry> } }
// DecisionEntry: { source, homepage, verdict, queue, country, reason }
//
// This is the single source of truth for every count shown on every screen.
// DemoProject, DemoQueueLanding, DemoDecisions, and sessionCounts all derive
// from this store. decideSource / proposeSource / changeDecision all write here.

function initDecisions() {
  const all = {};
  for (const [guid, proj] of Object.entries(PROJECTS)) {
    all[guid] = {};
    for (const q of proj.queues) {
      all[guid][q.id] = proj.decisions.filter(d => d.queue === q.id).map(d => ({ ...d }));
    }
  }
  return all;
}

export const decisionsStore = writable(initDecisions());

// ── Reviewer nav state (position + settings — NOT decisions) ─────────────
const INITIAL_REVIEWER = {
  sourceIdx:     0,
  guidelines:    GUIDELINES_DEFAULT,
  metaOverrides: {},
};
export const reviewState = writable(INITIAL_REVIEWER);

// ── sessionCounts: Q1 stats for proj_8fa221 derived from decisionsStore ──
const Q1_TOTAL = PROJECTS['proj_8fa221'].queues.find(q => q.guid === 'q1').total;

export const sessionCounts = derived(decisionsStore, ($d) => {
  const q1    = $d['proj_8fa221']?.['Queue #1'] ?? [];
  const kept    = q1.filter(d => d.verdict === 'kept').length;
  const removed = q1.filter(d => d.verdict === 'removed').length;
  const added   = q1.filter(d => d.verdict === 'added').length;
  const skipped = q1.filter(d => d.verdict === 'skipped').length;
  const decided = kept + removed + added + skipped;
  return {
    kept, removed, skipped, added, decided,
    totalKept:      kept,
    totalRemoved:   removed,
    totalSkipped:   skipped,
    totalAdded:     added,
    totalDecided:   decided,
    totalUndecided: Math.max(0, Q1_TOTAL - decided),
    queueTotal:     Q1_TOTAL,
  };
});

// ── Internal write helper ─────────────────────────────────────────────────
function _normalizeVerdict(v) {
  if (v === 'keep')   return 'kept';
  if (v === 'remove') return 'removed';
  if (v === 'skip')   return 'skipped';
  return v; // already normalized
}

function _writeDecision(projectGuid, queueId, source, homepage, rawVerdict, country, reason) {
  const verdict = _normalizeVerdict(rawVerdict);
  decisionsStore.update(all => {
    const list = [...(all[projectGuid]?.[queueId] ?? [])];
    const idx  = list.findIndex(d => d.source === source);
    const entry = { source, homepage, verdict, queue: queueId, country, reason: reason ?? null };
    if (idx >= 0) { list[idx] = entry; } else { list.push(entry); }
    return { ...all, [projectGuid]: { ...all[projectGuid], [queueId]: list } };
  });
}

// ── Action functions ──────────────────────────────────────────────────────

// Decide the current QUEUE_SOURCE and advance to the next.
export function decideSource(verdict, reason = null) {
  reviewState.update(s => {
    const src = QUEUE_SOURCES[s.sourceIdx];
    if (!src) return s;
    _writeDecision('proj_8fa221', 'Queue #1', src.title, src.homepage, verdict, src.country, reason);
    return { ...s, sourceIdx: s.sourceIdx + 1 };
  });
}

// Re-decide the current QUEUE_SOURCE WITHOUT advancing (used when navigating back).
export function redecideCurrentSource(verdict, reason = null) {
  reviewState.update(s => {
    const src = QUEUE_SOURCES[s.sourceIdx];
    if (!src) return s;
    _writeDecision('proj_8fa221', 'Queue #1', src.title, src.homepage, verdict, src.country, reason);
    return s;
  });
}

// Propose a brand-new source (adds as 'added' to Q1).
export function proposeSource(label, homepage) {
  _writeDecision('proj_8fa221', 'Queue #1', label, homepage, 'added', 'US', null);
}

// Change any decision in any queue (used by Decisions page and bucket modals).
export function changeDecision(projectGuid, queueId, sourceName, newVerdict, reason) {
  decisionsStore.update(all => {
    const list = [...(all[projectGuid]?.[queueId] ?? [])];
    const idx  = list.findIndex(d => d.source === sourceName);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        verdict: _normalizeVerdict(newVerdict),
        reason: reason !== undefined ? reason : list[idx].reason,
      };
    }
    return { ...all, [projectGuid]: { ...all[projectGuid], [queueId]: list } };
  });
}

export function navigateToSource(idx) {
  reviewState.update(s => ({ ...s, sourceIdx: Math.max(0, Math.min(QUEUE_SOURCES.length - 1, idx)) }));
}

export function saveGuidelines(text) {
  reviewState.update(s => ({ ...s, guidelines: text }));
}

export function saveSourceMeta(srcId, patch) {
  reviewState.update(s => ({
    ...s,
    metaOverrides: { ...s.metaOverrides, [srcId]: { ...(s.metaOverrides[srcId] || {}), ...patch } },
  }));
}

// ── Projects store (for Manage / All-projects lists) ─────────────────────
export const KNOWN_COLLECTIONS = {
  '34412803': { name: 'US · Top Online Local · 2024', sources: 318 },
  '29571100': { name: 'Brazil · Top Online · 2025',   sources: 412 },
  '18204455': { name: 'EU · Public Broadcasters',      sources: 198 },
  '42119007': { name: 'Africa · Radio · 2025',          sources: 247 },
};

const PROJECTS_INITIAL = [
  { guid: 'proj_8fa221', name: 'Climate Reporting · US East Coast',  status: 'in_progress', seeds: 5, queueCount: 4, progress: 0.35, closedAt: null },
  { guid: 'proj_b3c9d1', name: 'Spanish-language outlets · LATAM',   status: 'in_progress', seeds: 8, queueCount: 6, progress: 0.38, closedAt: null },
  { guid: 'proj_a7f3e2', name: 'Top Online · Brazil 2025',           status: 'in_progress', seeds: 3, queueCount: 3, progress: 0.48, closedAt: null },
  { guid: 'proj_d4c5b6', name: 'AI-generated content sweep',         status: 'in_progress', seeds: 2, queueCount: 2, progress: 0.60, closedAt: null },
  { guid: 'proj_f1e2a3', name: 'Public broadcasters · EU',           status: 'completed',   seeds: 4, queueCount: 3, progress: 1,    closedAt: 'closed Apr 12' },
  { guid: 'proj_c2d3e4', name: 'Top Online · Brazil 2024',           status: 'completed',   seeds: 2, queueCount: 2, progress: 1,    closedAt: 'closed Mar 03' },
];

export const projectsStore      = writable(PROJECTS_INITIAL);
export const inProgressProjects = derived(projectsStore, $p => $p.filter(p => p.status === 'in_progress'));
export const completedProjects  = derived(projectsStore, $p => $p.filter(p => p.status === 'completed'));

export function addProject(name, seeds) {
  projectsStore.update(ps => [{
    guid:       `proj_${Date.now().toString(36)}`,
    name,
    status:     'in_progress',
    seeds:      Math.max(seeds.length, 1),
    queueCount: 1,
    progress:   0,
    closedAt:   null,
  }, ...ps]);
}

// ── CSV export ────────────────────────────────────────────────────────────
export function downloadCSV(type) {
  const allDecisions = get(decisionsStore);
  const q1 = allDecisions['proj_8fa221']?.['Queue #1'] ?? [];

  let headers, rows, filename;
  if (type === 'project') {
    headers  = ['media_id', 'name', 'url', 'decision'];
    rows     = q1.filter(d => d.verdict === 'kept' || d.verdict === 'added')
                 .map(d => ['', d.source, d.homepage, d.verdict]);
    filename = 'climate-east-coast-project.csv';
  } else {
    headers  = ['media_id', 'name', 'url', 'decision', 'reason', 'queue'];
    rows     = q1.map(d => ['', d.source, d.homepage, d.verdict, d.reason || '', 'Queue #1']);
    filename = 'climate-east-coast-audit.csv';
  }

  const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
