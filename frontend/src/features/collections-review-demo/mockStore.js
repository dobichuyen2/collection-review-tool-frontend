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
export const BASE = { kept: 76, removed: 35, added: 3, skipped: 10, decided: 124, total: 200, undecided: 76 };

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
