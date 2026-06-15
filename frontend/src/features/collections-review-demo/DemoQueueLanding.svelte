<script>
  import Nav from './Nav.svelte';
  import DecisionBar from './DecisionBar.svelte';
  import { MOCK } from './mockData.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  const p = MOCK.project;
  const q = p.queues[0];

  $: queueTotals = { reviewed: q.done, kept: q.kept, removed: q.removed, added: q.added, skipped: q.skipped, undecided: q.undecided };
  $: queuePct = q.total > 0 ? Math.round((q.done / q.total) * 100) : 0;

  const DECISIONS = [
    { k: 'kept',    n: 'Kept',    v: q.kept,    color: '#E25C40' },
    { k: 'removed', n: 'Removed', v: q.removed, color: '#1A1C1F' },
    { k: 'added',   n: 'Added',   v: q.added,   color: '#F5A48A' },
    { k: 'skipped', n: 'Skipped', v: q.skipped, color: '#9CA0A8' },
  ];

  let highlight = null;

  function queueStatus(qq) {
    if (qq.done === qq.total) return 'Completed';
    if (qq.done === 0) return 'Unassigned';
    return 'In progress';
  }
</script>

<div class="landing">
  <Nav role="queue" projectCtx="Climate · East Coast" {onNavigate} variant={navVariant} />

  <!-- ── HERO ── -->
  <div class="hero">
    <div class="hero-eyebrow">You've been invited to review</div>
    <h1 class="hero-h1">{q.id}</h1>
    <div class="chips-row">
      <span class="chip chip-neutral">{q.total} sources assigned</span>
      <span class="chip chip-neutral">Project: Climate Reporting · US East Coast</span>
    </div>
    <p class="about-tool">
      <span class="about-label">How reviewing works. </span>
      You'll see one source at a time. For each, decide whether to
      <b class="about-kept"> Keep</b> it, <b class="about-removed">Remove</b> it, or <b class="about-skipped">Skip</b> if you're unsure.<br>
      You may also add new sources. No account needed; your progress saves automatically.
    </p>
  </div>

  <!-- ── YOUR QUEUE CARD ── -->
  <div class="section-pad">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Your queue</span>
        <span class="card-header-right">{q.undecided} left to decide</span>
      </div>

      <div class="progress-section">
        <div class="progress-row">
          <span class="progress-label">Progress · <b class="mono">{q.done}</b> of {q.total} sources decided</span>
          <span class="progress-pct">{queuePct}%</span>
        </div>
        <div class="bar-wrap">
          <DecisionBar totals={queueTotals} height={16} {highlight} />
        </div>
      </div>

      <div class="browse-label">Browse your decisions</div>
      <div class="decision-grid">
        {#each DECISIONS as b}
          <button
            class="decision-btn"
            style:border-color={highlight === b.k ? b.color : 'var(--v2-line)'}
            style:background={highlight === b.k ? `${b.color}0e` : '#fff'}
            on:mouseenter={() => highlight = b.k}
            on:mouseleave={() => highlight = null}
            on:focus={() => highlight = b.k}
            on:blur={() => highlight = null}
          >
            <div>
              <div class="decision-label-row">
                <span class="decision-swatch" style:background={b.color}></span>
                {b.n}
              </div>
              <div class="decision-count">{b.v}</div>
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
        <button class="btn btn-primary btn-lg" on:click={() => onNavigate('review')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          Open my queue
        </button>
        <button class="btn btn-lg" on:click={() => onNavigate('review')}>
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
        <span class="card-title">Project status</span>
        <span class="card-header-right">1,240 / 2,000 sources · 62%</span>
      </div>
      <div class="queues-grid" style:grid-template-columns="repeat({p.queues.length}, 1fr)">
        {#each p.queues as qq, i}
          <div class="queue-col" class:has-divider={i > 0}>
            <div class="queue-name">{qq.id}</div>
            <div class="queue-done">
              {qq.done}<span class="queue-total"> / {qq.total}</span>
            </div>
            <div class="queue-status">{queueStatus(qq)}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .landing {
    width: 100%;
    min-height: 820px;
    background: var(--v2-bg);
    color: var(--v2-ink);
    font-family: var(--v2-sans);
    padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 32px 72px 0; }
  .hero-eyebrow {
    font-size: 13.5px;
    color: var(--v2-mute);
    font-family: var(--v2-mono);
    margin-bottom: 10px;
  }
  .hero-h1 {
    font-size: 54px;
    font-weight: 600;
    letter-spacing: -1.8px;
    margin: 0;
    line-height: 1.04;
    color: var(--v2-ink);
    max-width: 900px;
  }

  .chips-row { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans);
  }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }

  .about-tool {
    margin: 18px 0 0;
    max-width: 920px;
    font-size: 15.5px;
    line-height: 1.6;
    color: var(--v2-body);
  }
  .about-label { font-weight: 500; color: var(--v2-ink); }
  .about-kept    { color: var(--v2-kept);    font-weight: 600; }
  .about-removed { color: var(--v2-removed); font-weight: 600; }
  .about-skipped { color: var(--v2-skipped); font-weight: 600; }

  /* ── Layout ── */
  .section-pad    { padding: 36px 72px 0; }
  .section-pad-sm { padding: 32px 72px 0; }

  /* ── Card ── */
  .card {
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
    overflow: hidden;
  }
  .card-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title { font-size: 16px; font-weight: 600; }
  .card-header-right { font-size: 14px; color: var(--v2-mute); font-family: var(--v2-mono); }

  /* ── Progress section ── */
  .progress-section { padding: 22px 24px; }
  .progress-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .progress-label { font-size: 15px; color: var(--v2-body); }
  .mono { font-family: var(--v2-mono); font-weight: 600; color: var(--v2-ink); }
  .progress-pct { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); }
  .bar-wrap { margin-top: 10px; }

  /* ── Decision tiles ── */
  .browse-label {
    padding: 0 24px 6px;
    font-size: 14px;
    color: var(--v2-mute);
  }
  .decision-grid {
    padding: 8px 18px 18px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .decision-btn {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid var(--v2-line);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-family: var(--v2-sans);
    text-align: left;
    transition: border-color .2s ease, background .2s ease;
    width: 100%;
  }
  .decision-label-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: var(--v2-body);
    font-weight: 500;
  }
  .decision-swatch { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
  .decision-count {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.7px;
    font-family: var(--v2-mono);
    margin-top: 4px;
    color: var(--v2-ink);
  }

  /* ── Card footer ── */
  .card-footer {
    padding: 14px 24px 18px;
    border-top: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: center;
    gap: 10px;
  }

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
  .btn-primary {
    background: var(--v2-ink); color: #fff; border: none;
    box-shadow: 0 1px 0 rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.18);
  }
  .btn-lg { padding: 12px 22px; font-size: 15px; }

  /* ── Project status ── */
  .status-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 22px;
  }
  .queues-grid {
    padding: 16px 24px;
    display: grid;
    gap: 22px;
  }
  .queue-col { display: flex; flex-direction: column; gap: 4px; padding-left: 18px; }
  .queue-col:first-child { padding-left: 0; }
  .queue-col.has-divider { border-left: 1px solid var(--v2-line-soft); }

  .queue-name { font-size: 14px; color: var(--v2-body); font-weight: 500; }
  .queue-done {
    font-size: 22px; font-weight: 600;
    font-family: var(--v2-mono); letter-spacing: -0.5px; color: var(--v2-ink);
  }
  .queue-total { font-size: 14px; color: var(--v2-mute); font-weight: 400; }
  .queue-status { font-size: 13.5px; color: var(--v2-mute); }
</style>
