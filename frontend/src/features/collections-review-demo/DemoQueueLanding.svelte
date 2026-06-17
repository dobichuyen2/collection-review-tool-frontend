<script>
  import Nav from './Nav.svelte';
  import DecisionBar from './DecisionBar.svelte';
  import { PROJECTS } from './mockData.js';
  import { decisionsStore, changeDecision } from './mockStore.js';
  import { get } from 'svelte/store';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  // URL: /demo/review-projects/{projectGuid}/queues/{queueGuid}
  const parts = window.location.pathname.split('/');
  const projectGuid = parts[3];
  const queueGuid = parts[5];

  const p = PROJECTS[projectGuid] ?? PROJECTS['proj_8fa221'];
  const q = p.queues.find(qq => qq.guid === queueGuid) ?? p.queues[0];

  // ── Derive queue stats from decisionsStore ────────────────────────────
  function computeStats(decisions) {
    const kept    = decisions.filter(d => d.verdict === 'kept').length;
    const removed = decisions.filter(d => d.verdict === 'removed').length;
    const added   = decisions.filter(d => d.verdict === 'added').length;
    const skipped = decisions.filter(d => d.verdict === 'skipped').length;
    const decided = kept + removed + added + skipped;
    return { kept, removed, added, skipped, decided, undecided: Math.max(0, q.total - decided) };
  }

  $: qDecisions = $decisionsStore[projectGuid]?.[q.id] ?? [];
  $: displayStats = computeStats(qDecisions);
  $: queuePct = q.total > 0 ? Math.round(displayStats.decided / q.total * 100) : 0;
  $: queueTotals = {
    reviewed: displayStats.decided,
    kept: displayStats.kept,
    removed: displayStats.removed,
    added: displayStats.added,
    skipped: displayStats.skipped,
    undecided: displayStats.undecided,
  };

  // ── Project-level totals from decisionsStore ─────────────────────────
  $: projectQueues = p.queues.map(qq => {
    const qd  = $decisionsStore[projectGuid]?.[qq.id] ?? [];
    const qs  = computeStats(qd);
    return { ...qq, ...qs };
  });
  $: projectDone  = projectQueues.reduce((s, qq) => s + qq.decided, 0);
  $: projectTotal = p.queues.reduce((s, qq) => s + qq.total, 0);
  $: projectPct   = projectTotal > 0 ? Math.round(projectDone / projectTotal * 100) : 0;
  $: projectStats = projectQueues.reduce((s, qq) => ({
    kept:    s.kept    + (qq.kept    ?? 0),
    removed: s.removed + (qq.removed ?? 0),
    added:   s.added   + (qq.added   ?? 0),
    skipped: s.skipped + (qq.skipped ?? 0),
  }), { kept: 0, removed: 0, added: 0, skipped: 0 });
  $: projectUndecided = Math.max(0, projectTotal - projectDone);

  const DECISION_TILES = [
    { k: 'kept',    label: 'Kept',    color: '#E25C40' },
    { k: 'removed', label: 'Removed', color: '#1A1C1F' },
    { k: 'added',   label: 'Added',   color: '#F5A48A' },
    { k: 'skipped', label: 'Skipped', color: '#9CA0A8' },
  ];

  const VERDICT_LABELS  = { kept: 'Kept', removed: 'Removed', added: 'Added', skipped: 'Skipped' };
  const VERDICT_COLORS  = { kept: '#E25C40', removed: '#1A1C1F', added: '#F5A48A', skipped: '#9CA0A8' };

  let highlight = null;

  // ── Bucket modal (Fix 4) ─────────────────────────────────────────────
  let bucketModal = null; // { verdict, sources }

  function openBucket(verdict) {
    const sources = (get(decisionsStore)[projectGuid]?.[q.id] ?? []).filter(d => d.verdict === verdict);
    bucketModal = { verdict, sources };
  }

  // sync bucket list when store changes
  $: if (bucketModal) {
    const sources = ($decisionsStore[projectGuid]?.[q.id] ?? []).filter(d => d.verdict === bucketModal.verdict);
    bucketModal = { ...bucketModal, sources };
  }

  let bucketChangeTarget = null;
  let bucketNewVerdict = '';
  let bucketReason = '';
  $: bucketReasonRequired = bucketNewVerdict === 'kept' || bucketNewVerdict === 'removed';
  $: bucketCanConfirm = bucketNewVerdict && (!bucketReasonRequired || bucketReason.trim());

  function openBucketChange(d) {
    bucketChangeTarget = { source: d.source };
    bucketNewVerdict = d.verdict;
    bucketReason = d.reason || '';
  }

  function confirmBucketChange() {
    if (!bucketCanConfirm) return;
    changeDecision(projectGuid, q.id, bucketChangeTarget.source, bucketNewVerdict, bucketReason.trim() || null);
    bucketChangeTarget = null;
    bucketReason = '';
  }

  function queueStatusLabel(qq) {
    if (qq.decided === qq.total && qq.total > 0) return 'Completed';
    if (qq.decided === 0) return 'Unassigned';
    return 'In progress';
  }
</script>

<div class="landing">
  <Nav
    role="queue"
    projectCtx={p.name}
    {projectGuid}
    {queueGuid}
    {onNavigate}
    variant={navVariant}
  />

  <!-- ── HERO ── -->
  <div class="hero">
    <div class="hero-eyebrow">You've been invited to review</div>
    <h1 class="hero-h1">{q.id}</h1>
    <div class="chips-row">
      <span class="chip chip-neutral">{q.total} sources assigned</span>
      <span class="chip chip-neutral">Project: {p.name}</span>
    </div>
    <p class="about-tool">
      <span class="about-label">How reviewing works. </span>
      You'll see one source at a time. For each, decide whether to
      <b class="about-kept"> Keep</b> it, <b class="about-removed">Remove</b> it, or <b class="about-skipped">Skip</b> if you're unsure.
      You may also add new sources. No account needed; your progress saves automatically.
    </p>
  </div>

  <!-- ── YOUR QUEUE CARD ── -->
  <div class="section-pad">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Your queue</span>
        <span class="card-header-right">{displayStats.undecided} left to decide</span>
      </div>

      <div class="progress-section">
        <div class="progress-row">
          <span class="progress-label">Progress · <b class="mono">{displayStats.decided}</b> of {q.total} sources decided</span>
          <span class="progress-pct">{queuePct}%</span>
        </div>
        <div class="bar-wrap">
          <DecisionBar totals={queueTotals} height={16} {highlight} />
        </div>
      </div>

      <div class="browse-label">Browse your decisions</div>
      <div class="decision-grid">
        {#each DECISION_TILES as b}
          <button
            class="decision-btn"
            style:border-color={highlight === b.k ? b.color : 'var(--v2-line)'}
            style:background={highlight === b.k ? `${b.color}0e` : '#fff'}
            on:mouseenter={() => highlight = b.k}
            on:mouseleave={() => highlight = null}
            on:focus={() => highlight = b.k}
            on:blur={() => highlight = null}
            on:click={() => openBucket(b.k)}
          >
            <div>
              <div class="decision-label-row">
                <span class="decision-swatch" style:background={b.color}></span>
                {b.label}
              </div>
              <div class="decision-count">{displayStats[b.k]}</div>
            </div>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
              style:color={highlight === b.k ? b.color : 'var(--v2-mute)'}
              style:transition="color .2s"
            ><path d="M7 17 17 7M9 7h8v8"/></svg>
          </button>
        {/each}
      </div>

      <div class="card-footer">
        <button class="btn btn-primary btn-lg" on:click={() => onNavigate('/demo/reviews/124')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          Open my queue
        </button>
        <button class="btn btn-lg" on:click={() => onNavigate(`/demo/review-projects/${projectGuid}/queues/${queueGuid}/decisions`)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="m2 14 10 5 10-5M2 11l10 5 10-5"/></svg>
          Review all decisions
        </button>
      </div>
    </div>
  </div>

  <!-- ── PROJECT STATUS CARD ── -->
  <div class="section-pad-sm">
    <div class="card">
      <div class="status-header">
        <span class="card-title">Project-wide status</span>
        <span class="card-header-right">
          {projectDone.toLocaleString()} / {projectTotal.toLocaleString()} sources · {projectPct}%
        </span>
      </div>
      <div class="project-totals">
        {#each [
          { label: 'Total',     value: projectTotal,              color: 'var(--v2-ink)' },
          { label: 'Kept',      value: projectStats.kept,         color: '#E25C40' },
          { label: 'Added',     value: projectStats.added,        color: '#F5A48A' },
          { label: 'Removed',   value: projectStats.removed,      color: '#1A1C1F' },
          { label: 'Skipped',   value: projectStats.skipped,      color: '#9CA0A8' },
          { label: 'Undecided', value: projectUndecided,          color: 'var(--v2-mute)' },
        ] as t, i}
          <div class="ptotal-col" class:has-divider={i > 0}>
            <div class="ptotal-label" style:color={t.color}>{t.label}</div>
            <div class="ptotal-value" style:color={t.color}>{t.value.toLocaleString()}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- ── BUCKET MODAL (Fix 4) ── -->
{#if bucketModal}
  <div class="modal-overlay" on:click={() => { bucketModal = null; bucketChangeTarget = null; }} role="dialog" aria-modal="true">
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <div>
          <div class="modal-title" style:color={VERDICT_COLORS[bucketModal.verdict]}>
            {VERDICT_LABELS[bucketModal.verdict]}
            <span class="modal-count">{bucketModal.sources.length}</span>
          </div>
          <div class="modal-subtitle">{q.id} · {p.name}</div>
        </div>
        <button class="modal-close" on:click={() => { bucketModal = null; bucketChangeTarget = null; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>

      {#if bucketModal.sources.length === 0}
        <div class="bucket-empty">No sources in this bucket yet.</div>
      {:else}
        <div class="bucket-list">
          {#each bucketModal.sources as d}
            {@const isChanging = bucketChangeTarget?.source === d.source}
            <div class="bucket-row" class:bucket-row-changing={isChanging}>
              <div class="bucket-info">
                <div class="bucket-source">{d.source}</div>
                <div class="bucket-meta">{d.homepage}</div>
                {#if d.reason}<div class="bucket-reason">"{d.reason}"</div>{/if}
              </div>
              {#if isChanging}
                <div class="bucket-change-form">
                  <div class="verdict-chips">
                    {#each ['kept','removed','added','skipped'] as v}
                      <button
                        class="verdict-chip-btn"
                        class:verdict-chip-active={bucketNewVerdict === v}
                        style:--c={VERDICT_COLORS[v]}
                        on:click={() => bucketNewVerdict = v}
                      >{VERDICT_LABELS[v]}</button>
                    {/each}
                  </div>
                  {#if bucketReasonRequired || bucketReason}
                    <textarea
                      class="bucket-reason-input"
                      bind:value={bucketReason}
                      placeholder={bucketReasonRequired ? 'Reason required…' : 'Note (optional)…'}
                      rows="2"
                    ></textarea>
                  {/if}
                  <div class="bucket-change-actions">
                    <button class="btn btn-sm" on:click={() => { bucketChangeTarget = null; bucketReason = ''; }}>Cancel</button>
                    <button class="btn btn-sm btn-primary" class:btn-dim={!bucketCanConfirm} on:click={confirmBucketChange}>Save</button>
                  </div>
                </div>
              {:else}
                <button class="btn btn-sm" on:click={() => openBucketChange(d)}>Change</button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .landing {
    width: 100%; min-height: 820px;
    background: var(--v2-bg); color: var(--v2-ink);
    font-family: var(--v2-sans); padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 32px 120px 0; }
  .hero-eyebrow { font-size: 13.5px; color: var(--v2-mute); font-family: var(--v2-mono); margin-bottom: 10px; }
  .hero-h1 { font-size: 62px; font-weight: 600; letter-spacing: -1.8px; margin: 0; line-height: 1.04; color: var(--v2-ink); max-width: 900px; }
  .chips-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans); }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }
  .about-tool { margin: 18px 0 0; max-width: 920px; font-size: 17px; line-height: 1.6; color: var(--v2-body); }
  .about-label { font-weight: 500; color: var(--v2-ink); }
  .about-kept    { color: var(--v2-kept);    font-weight: 600; }
  .about-removed { color: var(--v2-removed); font-weight: 600; }
  .about-skipped { color: var(--v2-skipped); font-weight: 600; }

  /* ── Layout ── */
  .section-pad    { padding: 36px 120px 0; }
  .section-pad-sm { padding: 32px 120px 0; }

  /* ── Card ── */
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }
  .card-header { padding: 16px 24px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: center; justify-content: space-between; }
  .card-title { font-size: 18px; font-weight: 600; }
  .card-header-right { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); }

  /* ── Progress ── */
  .progress-section { padding: 22px 24px; }
  .progress-row { display: flex; align-items: baseline; justify-content: space-between; }
  .progress-label { font-size: 16.5px; color: var(--v2-body); }
  .mono { font-family: var(--v2-mono); font-weight: 600; color: var(--v2-ink); }
  .progress-pct { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); }
  .bar-wrap { margin-top: 10px; }

  /* ── Decision tiles ── */
  .browse-label { padding: 0 24px 6px; font-size: 14px; color: var(--v2-mute); }
  .decision-grid { padding: 8px 18px 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .decision-btn {
    padding: 14px 16px; border-radius: 12px; border: 1px solid var(--v2-line); background: #fff;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; font-family: var(--v2-sans); text-align: left;
    transition: border-color .2s ease, background .2s ease; width: 100%;
  }
  .decision-label-row { display: inline-flex; align-items: center; gap: 8px; font-size: 16.5px; color: var(--v2-body); font-weight: 500; }
  .decision-swatch { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
  .decision-count { font-size: 30px; font-weight: 600; letter-spacing: -0.7px; font-family: var(--v2-mono); margin-top: 4px; color: var(--v2-ink); }

  /* ── Card footer ── */
  .card-footer { padding: 14px 24px 18px; border-top: 1px solid var(--v2-line-soft); display: flex; align-items: center; gap: 10px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 999px;
    background: var(--v2-card); color: var(--v2-ink);
    border: 1px solid var(--v2-line);
    font-family: var(--v2-sans); font-size: 13.5px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }
  .btn-primary { background: var(--v2-ink); color: #fff; border: none; box-shadow: 0 1px 0 rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.18); }
  .btn-sm { padding: 7px 12px; font-size: 12.5px; }
  .btn-lg { padding: 12px 22px; font-size: 15px; }
  .btn-dim { opacity: .45; pointer-events: none; }

  /* ── Project status ── */
  .status-header { padding: 16px 24px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: baseline; justify-content: space-between; gap: 22px; }
  .project-totals { padding: 18px 24px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; }
  .ptotal-col { display: flex; flex-direction: column; gap: 4px; padding: 0 18px 0 0; }
  .ptotal-col.has-divider { padding-left: 18px; border-left: 1px solid var(--v2-line-soft); }
  .ptotal-label { font-size: 13px; color: var(--v2-mute); text-transform: uppercase; letter-spacing: .5px; font-weight: 600; }
  .ptotal-value { font-size: 26px; font-weight: 600; font-family: var(--v2-mono); letter-spacing: -0.5px; }
  /* ── Bucket modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(20,23,30,.42); backdrop-filter: blur(3px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 56px 24px; overflow-y: auto;
  }
  .modal { width: 100%; max-width: 520px; background: var(--v2-card); border-radius: 18px; border: 1px solid var(--v2-line); box-shadow: 0 30px 70px -24px rgba(20,23,30,.45); overflow: hidden; flex-shrink: 0; }
  .modal-header { padding: 18px 24px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
  .modal-title { font-size: 19px; font-weight: 600; color: var(--v2-ink); display: flex; align-items: center; gap: 10px; }
  .modal-count { font-size: 15px; font-weight: 400; color: var(--v2-mute); font-family: var(--v2-mono); }
  .modal-subtitle { font-size: 13.5px; color: var(--v2-mute); margin-top: 3px; }
  .modal-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--v2-line); background: #fff; color: var(--v2-body); cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
  .bucket-empty { padding: 32px 24px; text-align: center; color: var(--v2-mute); font-size: 14px; }
  .bucket-list { max-height: 400px; overflow-y: auto; }
  .bucket-row { padding: 14px 24px; border-top: 1px solid var(--v2-line-soft); display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .bucket-row:first-child { border-top: none; }
  .bucket-row-changing { background: var(--v2-line-soft); }
  .bucket-info { flex: 1; min-width: 0; }
  .bucket-source { font-size: 14.5px; font-weight: 500; color: var(--v2-ink); }
  .bucket-meta { font-size: 13px; color: var(--v2-mute); font-family: var(--v2-mono); margin-top: 2px; }
  .bucket-reason { font-size: 13px; color: var(--v2-body); font-style: italic; margin-top: 4px; }
  .bucket-change-form { flex: 1; }
  .verdict-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .verdict-chip-btn { padding: 5px 11px; border-radius: 999px; border: 1px solid var(--v2-line); background: var(--v2-card); color: var(--v2-body); font-size: 12.5px; font-family: var(--v2-sans); cursor: pointer; transition: border-color .15s, background .15s; }
  .verdict-chip-btn:hover { border-color: var(--c); }
  .verdict-chip-active { border-color: var(--c) !important; background: color-mix(in srgb, var(--c) 10%, white); color: var(--c); font-weight: 600; }
  .bucket-reason-input { width: 100%; border: 1px solid var(--v2-line); border-radius: 8px; padding: 7px 10px; font-size: 13px; font-family: var(--v2-sans); color: var(--v2-ink); resize: none; outline: none; margin-bottom: 8px; }
  .bucket-change-actions { display: flex; gap: 8px; }
</style>
