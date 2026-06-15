import { writable, derived } from 'svelte/store';

// Six sources the reviewer will step through in the demo queue.
export const QUEUE_SOURCES = [
  { id: 'src_001', title: 'The Capital Gazette',     homepage: 'capitalgazette.com',     isNew: false, language: 'English', country: 'United States', state: 'Maryland',      mediaType: 'Local · Daily'       },
  { id: 'src_002', title: 'Baltimore Banner',         homepage: 'thebaltimorebanner.com', isNew: false, language: 'English', country: 'United States', state: 'Maryland',      mediaType: 'Non-profit · Online' },
  { id: 'src_003', title: 'Delaware Online',          homepage: 'delawareonline.com',     isNew: false, language: 'English', country: 'United States', state: 'Delaware',      mediaType: 'Local · Daily'       },
  { id: 'src_004', title: 'WTOP News',                homepage: 'wtop.com',               isNew: false, language: 'English', country: 'United States', state: 'Washington DC', mediaType: 'Radio · Online'      },
  { id: 'src_005', title: 'Virginia Mercury',         homepage: 'virginiamercury.com',    isNew: false, language: 'English', country: 'United States', state: 'Virginia',      mediaType: 'Non-profit · Online' },
  { id: 'src_006', title: 'Washington City Paper',    homepage: 'washingtoncitypaper.com',isNew: true,  language: 'English', country: 'United States', state: 'Washington DC', mediaType: 'Alt-Weekly'          },
];

// Pre-existing Queue #1 stats before the demo session starts.
// Reviewer is picking up mid-queue.
export const BASE = { kept: 5, removed: 1, added: 1, skipped: 0, decided: 7, total: 13, undecided: 6 };

export const GUIDELINES_DEFAULT =
`## Review guidelines

**Keep** sources that do original local reporting at least weekly.

**Remove** aggregators, syndicate-only mirrors, and defunct sites.

**Skip** when you're unsure — leave a note for the lead reviewer.`;

const INITIAL = {
  sourceIdx:     0,
  decisions:     {}, // { src_id: { verdict: 'keep'|'remove'|'skip', reason: string|null } }
  addedSources:  [], // [{ label, homepage }]
  guidelines:    GUIDELINES_DEFAULT,
  metaOverrides: {}, // { src_id: { language?, country?, state? } }
};

export const reviewState = writable(INITIAL);

export const sessionCounts = derived(reviewState, ($s) => {
  const decs     = Object.values($s.decisions);
  const kept     = decs.filter(d => d.verdict === 'keep').length;
  const removed  = decs.filter(d => d.verdict === 'remove').length;
  const skipped  = decs.filter(d => d.verdict === 'skip').length;
  const added    = $s.addedSources.length;
  const decided  = kept + removed + skipped;
  return {
    kept, removed, skipped, added, decided,
    totalKept:      BASE.kept      + kept,
    totalRemoved:   BASE.removed   + removed,
    totalSkipped:   BASE.skipped   + skipped,
    totalAdded:     BASE.added     + added,
    totalDecided:   BASE.decided   + decided,
    totalUndecided: Math.max(0, BASE.undecided - decided),
    queueTotal:     BASE.total,
  };
});

// ── Action functions ──────────────────────────────────────────────────────────

export function decideSource(verdict, reason = null) {
  reviewState.update(s => {
    const src = QUEUE_SOURCES[s.sourceIdx];
    if (!src) return s;
    return {
      ...s,
      decisions:  { ...s.decisions, [src.id]: { verdict, reason } },
      sourceIdx:  s.sourceIdx + 1,
    };
  });
}

export function proposeSource(label, homepage) {
  reviewState.update(s => ({
    ...s,
    addedSources: [...s.addedSources, { label, homepage }],
  }));
}

export function saveGuidelines(text) {
  reviewState.update(s => ({ ...s, guidelines: text }));
}

export function saveSourceMeta(srcId, patch) {
  reviewState.update(s => ({
    ...s,
    metaOverrides: {
      ...s.metaOverrides,
      [srcId]: { ...(s.metaOverrides[srcId] || {}), ...patch },
    },
  }));
}

// ── Projects store ────────────────────────────────────────────────────────────

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

// Trigger a mock CSV download in the browser.
export function downloadCSV(type, state) {
  let headers, rows, filename;
  const { decisions, addedSources } = state;

  if (type === 'project') {
    headers  = ['media_id', 'name', 'url', 'decision'];
    rows     = QUEUE_SOURCES
      .filter(s => decisions[s.id]?.verdict === 'keep')
      .map(s  => [s.id, s.title, s.homepage, 'keep']);
    addedSources.forEach(s => rows.push(['', s.label, s.homepage, 'add']));
    filename = 'climate-east-coast-project.csv';
  } else {
    headers  = ['media_id', 'name', 'url', 'decision', 'removal_reason', 'queue'];
    rows     = QUEUE_SOURCES
      .filter(s => decisions[s.id])
      .map(s  => [s.id, s.title, s.homepage, decisions[s.id].verdict, decisions[s.id].reason || '', 'Queue #1']);
    addedSources.forEach(s => rows.push(['', s.label, s.homepage, 'add', '', 'Queue #1']));
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
