<script>
  import Nav from './Nav.svelte';
  import { PROJECTS } from './mockData.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  // URL: /demo/review-projects/{projectGuid}/decisions
  //   OR /demo/review-projects/{projectGuid}/queues/{queueGuid}/decisions
  const parts = window.location.pathname.split('/');
  const projectGuid = parts[3];
  const isQueueLevel = parts[4] === 'queues';
  const queueGuid = isQueueLevel ? parts[5] : null;

  const p = PROJECTS[projectGuid] ?? null;
  const q = isQueueLevel && p ? (p.queues.find(qq => qq.guid === queueGuid) ?? null) : null;

  const allDecisions = p?.decisions ?? [];
  const decisions = isQueueLevel && q
    ? allDecisions.filter(d => d.queue === q.id)
    : allDecisions;

  const navRole = isQueueLevel ? 'queue-decisions' : 'all-decisions';
  const heroTitle = isQueueLevel ? `${q?.id ?? 'Queue'} · Decisions` : 'All Decisions';
  const heroSub = p?.name ?? '';

  const cols = isQueueLevel
    ? '1.6fr 1.4fr 0.8fr 0.9fr'
    : '1.4fr 1.2fr 1fr 0.7fr 0.8fr';

  const VERDICT_COLORS = {
    kept:    '#E25C40',
    removed: '#1A1C1F',
    added:   '#F5A48A',
    skipped: '#9CA0A8',
  };
  const VERDICT_LABELS = { kept: 'Kept', removed: 'Removed', added: 'Added', skipped: 'Skipped' };

  const counts = decisions.reduce((acc, d) => {
    acc[d.verdict] = (acc[d.verdict] || 0) + 1;
    return acc;
  }, {});

  let filter = 'all';
  $: shown = filter === 'all' ? decisions : decisions.filter(d => d.verdict === filter);
</script>

<div class="page">
  <Nav
    role={navRole}
    projectCtx={p ? p.name : null}
    {projectGuid}
    {queueGuid}
    {onNavigate}
    variant={navVariant}
  />

  <div class="hero">
    <div class="breadcrumb">
      <button class="breadcrumb-link" on:click={() => onNavigate(`/demo/review-projects/${projectGuid}`)}>
        {heroSub}
      </button>
      {#if isQueueLevel}
        <span class="breadcrumb-sep">›</span>
        <button class="breadcrumb-link" on:click={() => onNavigate(`/demo/review-projects/${projectGuid}/queues/${queueGuid}`)}>
          {q?.id ?? 'Queue'}
        </button>
      {/if}
    </div>
    <h1 class="hero-h1">{heroTitle}</h1>
    <div class="chips-row">
      <span class="chip chip-neutral">{decisions.length} total decisions</span>
      {#if counts.kept}<span class="chip" style:background="rgba(226,92,64,.1)" style:color="#E25C40">{counts.kept} kept</span>{/if}
      {#if counts.removed}<span class="chip" style:background="#f0f0f0" style:color="#1A1C1F">{counts.removed} removed</span>{/if}
      {#if counts.added}<span class="chip" style:background="rgba(245,164,138,.18)" style:color="#c04a2a">{counts.added} added</span>{/if}
      {#if counts.skipped}<span class="chip" style:background="#f3f3f4" style:color="#9CA0A8">{counts.skipped} skipped</span>{/if}
    </div>
  </div>

  <!-- Filter bar -->
  <div class="filter-bar">
    {#each ['all', 'kept', 'removed', 'added', 'skipped'] as v}
      {#if v === 'all' || counts[v]}
        <button
          class="filter-btn"
          class:active={filter === v}
          style:--accent={v !== 'all' ? VERDICT_COLORS[v] : 'var(--v2-ink)'}
          on:click={() => filter = v}
        >
          {#if v !== 'all'}
            <span class="filter-dot" style:background={VERDICT_COLORS[v]}></span>
          {/if}
          {v === 'all' ? 'All' : VERDICT_LABELS[v]}
          <span class="filter-count">{v === 'all' ? decisions.length : (counts[v] ?? 0)}</span>
        </button>
      {/if}
    {/each}
  </div>

  <!-- Decisions table -->
  <div class="table-wrap">
    {#if !p}
      <div class="empty">Project not found.</div>
    {:else if shown.length === 0}
      <div class="empty">No decisions in this view.</div>
    {:else}
      <div class="card">
        <div class="table-head" style:grid-template-columns={cols}>
          <div>Source</div>
          <div>URL</div>
          {#if !isQueueLevel}<div>Queue</div>{/if}
          <div>Country</div>
          <div>Decision</div>
        </div>
        {#each shown as d, i}
          <div class="table-row" class:first={i === 0} style:grid-template-columns={cols}>
            <div class="source-name">{d.source}</div>
            <div class="source-url">{d.homepage}</div>
            {#if !isQueueLevel}<div class="source-queue">{d.queue}</div>{/if}
            <div class="source-country">{d.country}</div>
            <div>
              <span class="verdict-chip" style:background="{VERDICT_COLORS[d.verdict]}18" style:color={VERDICT_COLORS[d.verdict]}>
                <span class="verdict-dot" style:background={VERDICT_COLORS[d.verdict]}></span>
                {VERDICT_LABELS[d.verdict]}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    width: 100%;
    min-height: 820px;
    background: var(--v2-bg);
    color: var(--v2-ink);
    font-family: var(--v2-sans);
    padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 32px 72px 0; }
  .breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 13.5px; font-family: var(--v2-mono); color: var(--v2-mute);
    margin-bottom: 10px;
  }
  .breadcrumb-link {
    background: none; border: none; padding: 0; cursor: pointer;
    color: var(--v2-ink); font-size: 13.5px; font-family: var(--v2-mono);
  }
  .breadcrumb-link:hover { text-decoration: underline; }
  .breadcrumb-sep { color: var(--v2-mute); }

  .hero-h1 {
    font-size: 42px; font-weight: 600; letter-spacing: -1.4px;
    margin: 0; line-height: 1.04; color: var(--v2-ink);
  }
  .chips-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans);
  }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }

  /* ── Filter bar ── */
  .filter-bar {
    padding: 20px 72px 0;
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .filter-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 999px;
    background: var(--v2-card); color: var(--v2-body);
    border: 1px solid var(--v2-line);
    font-family: var(--v2-sans); font-size: 13.5px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: border-color .15s, background .15s;
  }
  .filter-btn:hover { border-color: var(--accent); }
  .filter-btn.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, white);
    color: var(--accent);
    font-weight: 600;
  }
  .filter-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .filter-count {
    font-size: 12.5px; font-family: var(--v2-mono); font-weight: 600;
    color: var(--v2-mute); padding-left: 2px;
  }
  .filter-btn.active .filter-count { color: inherit; opacity: 0.7; }

  /* ── Table ── */
  .table-wrap { padding: 16px 72px 0; }
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }

  .table-head {
    display: grid;
    grid-template-columns: 1.4fr 1.2fr 1fr 0.7fr 0.8fr;
    padding: 12px 22px 8px;
    font-size: 12px; color: var(--v2-mute); font-weight: 600;
    letter-spacing: .6px; text-transform: uppercase;
    gap: 14px;
  }
  .table-row {
    display: grid;
    grid-template-columns: 1.4fr 1.2fr 1fr 0.7fr 0.8fr;
    padding: 13px 22px;
    border-top: 1px solid var(--v2-line-soft);
    gap: 14px; align-items: center;
  }
  .table-row.first { border-top: none; }

  .source-name { font-size: 14px; font-weight: 500; color: var(--v2-ink); }
  .source-url  { font-size: 13px; color: var(--v2-mute); font-family: var(--v2-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .source-queue { font-size: 13px; color: var(--v2-body); font-family: var(--v2-mono); }
  .source-country { font-size: 13px; color: var(--v2-body); }

  .verdict-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13px; font-weight: 600;
  }
  .verdict-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }

  .empty {
    padding: 48px 22px;
    text-align: center;
    color: var(--v2-mute);
    font-size: 14.5px;
  }
</style>
