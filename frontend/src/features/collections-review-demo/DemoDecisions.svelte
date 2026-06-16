<script>
  import Nav from './Nav.svelte';
  import { PROJECTS } from './mockData.js';
  import { decisionsStore, changeDecision } from './mockStore.js';

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

  const navRole = isQueueLevel ? 'queue-decisions' : 'all-decisions';
  const heroTitle = isQueueLevel ? `${q?.id ?? 'Queue'} · Decisions` : 'All Decisions';

  const VERDICT_COLORS = {
    kept:    '#E25C40',
    removed: '#1A1C1F',
    added:   '#F5A48A',
    skipped: '#9CA0A8',
  };
  const VERDICT_LABELS = { kept: 'Kept', removed: 'Removed', added: 'Added', skipped: 'Skipped' };

  const cols = isQueueLevel
    ? '1.6fr 1.4fr 0.8fr 1fr 52px'
    : '1.4fr 1.2fr 1fr 0.7fr 1fr 52px';

  // ── Derive decisions from decisionsStore (reactive) ───────────────────
  $: projDecisions = $decisionsStore[projectGuid] ?? {};

  $: allDecisions = isQueueLevel && q
    ? (projDecisions[q.id] ?? [])
    : Object.values(projDecisions).flat();

  $: counts = allDecisions.reduce((acc, d) => {
    acc[d.verdict] = (acc[d.verdict] || 0) + 1;
    return acc;
  }, {});

  let filter = 'all';
  $: shown = filter === 'all' ? allDecisions : allDecisions.filter(d => d.verdict === filter);

  // ── Change-decision inline form (Fix 3) ──────────────────────────────
  let changing = null; // { source, queueId, currentVerdict, reason }
  let newVerdict = '';
  let newReason = '';
  $: reasonRequired = newVerdict === 'kept' || newVerdict === 'removed';
  $: canConfirm = newVerdict && (!reasonRequired || newReason.trim());

  function openChange(d) {
    // Find which queue this source belongs to
    const queueId = d.queue;
    changing = { source: d.source, queueId, currentVerdict: d.verdict, reason: d.reason };
    newVerdict = d.verdict;
    newReason = d.reason || '';
  }

  function cancelChange() {
    changing = null;
    newReason = '';
  }

  function confirmChange() {
    if (!canConfirm) return;
    changeDecision(projectGuid, changing.queueId, changing.source, newVerdict, newReason.trim() || null);
    changing = null;
    newReason = '';
  }
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
        {p?.name ?? ''}
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
      <span class="chip chip-neutral">{allDecisions.length} total decisions</span>
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
          <span class="filter-count">{v === 'all' ? allDecisions.length : (counts[v] ?? 0)}</span>
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
          <div></div>
        </div>
        {#each shown as d, i}
          {@const isChanging = changing?.source === d.source && changing?.queueId === d.queue}
          {#if isChanging}
            <!-- Inline change form -->
            <div class="change-form" class:first={i === 0}>
              <div class="change-source">
                <div class="source-name">{d.source}</div>
                <div class="source-url">{d.homepage}</div>
              </div>
              <div class="change-controls">
                <div class="verdict-chips">
                  {#each ['kept','removed','added','skipped'] as v}
                    <button
                      class="verdict-chip-btn"
                      class:verdict-chip-active={newVerdict === v}
                      style:--c={VERDICT_COLORS[v]}
                      on:click={() => newVerdict = v}
                    >{VERDICT_LABELS[v]}</button>
                  {/each}
                </div>
                {#if reasonRequired || newReason}
                  <textarea
                    class="reason-input"
                    bind:value={newReason}
                    placeholder={reasonRequired ? 'Reason required…' : 'Note (optional)…'}
                    rows="2"
                  ></textarea>
                {/if}
                <div class="change-actions">
                  <button class="btn btn-sm" on:click={cancelChange}>Cancel</button>
                  <button class="btn btn-sm btn-primary" class:btn-dim={!canConfirm} on:click={confirmChange}>Save</button>
                </div>
              </div>
            </div>
          {:else}
            <div class="table-row" class:first={i === 0} class:stripe={i % 2 === 1} style:grid-template-columns={cols}>
              <div class="source-name">{d.source}</div>
              <div class="source-url">{d.homepage}</div>
              {#if !isQueueLevel}<div class="source-queue">{d.queue}</div>{/if}
              <div class="source-country">{d.country ?? '—'}</div>
              <div>
                <span class="verdict-chip" style:background="{VERDICT_COLORS[d.verdict]}18" style:color={VERDICT_COLORS[d.verdict]}>
                  <span class="verdict-dot" style:background={VERDICT_COLORS[d.verdict]}></span>
                  {VERDICT_LABELS[d.verdict]}
                </span>
                {#if d.reason}
                  <div class="row-reason">"{d.reason}"</div>
                {/if}
              </div>
              <div>
                <button class="btn-icon" title="Change decision" on:click={() => openChange(d)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    width: 100%; min-height: 820px;
    background: var(--v2-bg); color: var(--v2-ink);
    font-family: var(--v2-sans); padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 32px 96px 0; }
  .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-family: var(--v2-mono); color: var(--v2-mute); margin-bottom: 10px; }
  .breadcrumb-link { background: none; border: none; padding: 0; cursor: pointer; color: var(--v2-ink); font-size: 13.5px; font-family: var(--v2-mono); }
  .breadcrumb-link:hover { text-decoration: underline; }
  .breadcrumb-sep { color: var(--v2-mute); }
  .hero-h1 { font-size: 48px; font-weight: 600; letter-spacing: -1.4px; margin: 0; line-height: 1.04; color: var(--v2-ink); }
  .chips-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans); }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }

  /* ── Filter bar ── */
  .filter-bar { padding: 20px 96px 0; display: flex; gap: 6px; flex-wrap: wrap; }
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
  .filter-btn.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, white); color: var(--accent); font-weight: 600; }
  .filter-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .filter-count { font-size: 12.5px; font-family: var(--v2-mono); font-weight: 600; color: var(--v2-mute); padding-left: 2px; }
  .filter-btn.active .filter-count { color: inherit; opacity: 0.7; }

  /* ── Table ── */
  .table-wrap { padding: 16px 96px 0; }
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }
  .table-head { display: grid; padding: 12px 22px 8px; font-size: 13px; color: var(--v2-mute); font-weight: 600; letter-spacing: .6px; text-transform: uppercase; gap: 14px; }
  .table-row { display: grid; padding: 13px 22px; border-top: 1px solid var(--v2-line-soft); gap: 14px; align-items: start; }
  .table-row.first { border-top: none; }
  .stripe { background: #FAFAF9; }

  .source-name { font-size: 15.5px; font-weight: 500; color: var(--v2-ink); }
  .source-url { font-size: 14px; color: var(--v2-mute); font-family: var(--v2-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .source-queue { font-size: 14px; color: var(--v2-body); font-family: var(--v2-mono); }
  .source-country { font-size: 14px; color: var(--v2-body); }
  .row-reason { font-size: 12px; color: var(--v2-mute); font-style: italic; margin-top: 3px; }

  .verdict-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .verdict-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }

  /* ── Change button ── */
  .btn-icon {
    width: 28px; height: 28px; border-radius: 7px;
    border: 1px solid var(--v2-line); background: var(--v2-card);
    color: var(--v2-mute); cursor: pointer;
    display: grid; place-items: center;
    transition: border-color .15s, color .15s;
  }
  .btn-icon:hover { border-color: var(--v2-ink); color: var(--v2-ink); }

  /* ── Inline change form ── */
  .change-form {
    padding: 16px 22px;
    border-top: 1px solid var(--v2-line-soft);
    background: var(--v2-line-soft);
    display: flex; gap: 24px; align-items: flex-start;
  }
  .change-form.first { border-top: none; }
  .change-source { flex: 0 0 200px; }
  .change-controls { flex: 1; }
  .verdict-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .verdict-chip-btn {
    padding: 6px 12px; border-radius: 999px; border: 1px solid var(--v2-line);
    background: var(--v2-card); color: var(--v2-body);
    font-size: 13px; font-family: var(--v2-sans); cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .verdict-chip-btn:hover { border-color: var(--c); }
  .verdict-chip-active { border-color: var(--c) !important; background: color-mix(in srgb, var(--c) 10%, white); color: var(--c); font-weight: 600; }
  .reason-input {
    width: 100%; border: 1px solid var(--v2-line); border-radius: 8px;
    padding: 8px 10px; font-size: 13.5px; font-family: var(--v2-sans);
    color: var(--v2-ink); resize: none; outline: none; margin-bottom: 8px;
  }
  .change-actions { display: flex; gap: 8px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 999px;
    background: var(--v2-card); color: var(--v2-ink);
    border: 1px solid var(--v2-line);
    font-family: var(--v2-sans); font-size: 13.5px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
  }
  .btn-primary { background: var(--v2-ink); color: #fff; border: none; }
  .btn-sm { padding: 7px 12px; font-size: 12.5px; }
  .btn-dim { opacity: .45; pointer-events: none; }

  .empty { padding: 48px 22px; text-align: center; color: var(--v2-mute); font-size: 14.5px; }
</style>
