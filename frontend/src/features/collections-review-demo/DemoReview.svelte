<script>
  import Nav from './Nav.svelte';
  import { MOCK } from './mockData.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  const s = MOCK.source;

  const META = [
    { k: 'Language',    v: s.language, ok: true  },
    { k: 'Pub country', v: s.country,  ok: true  },
    { k: 'Pub state',   v: s.state,    ok: false },
  ];

  const SIDEBAR_STATUS = [
    { n: 84, l: 'kept',    color: '#E25C40' },
    { n: 32, l: 'removed', color: '#1A1C1F' },
    { n:  6, l: 'skipped', color: '#9CA0A8' },
    { n:  2, l: 'added',   color: '#F5A48A' },
  ];
</script>

<div class="review-page">
  <Nav role="queue" projectCtx="Climate · East Coast" {onNavigate} variant={navVariant} />

  <!-- ── ACTION BAR ── -->
  <div class="action-bar-wrap">
    <div class="action-bar">
      <button class="btn btn-sm" on:click={() => onNavigate('landing')}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg)"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Back to queue
      </button>
      <div class="action-divider"></div>
      <button class="btn btn-sm">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg)"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Prev
      </button>
      <button class="btn btn-sm">
        Next
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
      <div class="progress-pill">
        <span class="progress-current">124</span>
        <span class="progress-sep">/ 200</span>
        <div class="progress-mini-track">
          <div class="progress-mini-fill"></div>
        </div>
        <span class="progress-pct-sm">62%</span>
      </div>
      <div class="action-spacer"></div>
      <button class="btn btn-sm">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="m2 14 10 5 10-5M2 11l10 5 10-5"/></svg>
        All decisions · 124
      </button>
      <button class="btn btn-primary btn-sm">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Propose new source
      </button>
    </div>
  </div>

  <!-- ── TWO-COLUMN LAYOUT ── -->
  <div class="main-grid">

    <!-- Left: source card -->
    <div class="card">
      <!-- Source header -->
      <div class="source-header">
        <div class="chips-row">
          <span class="chip chip-accent"><span class="chip-dot chip-dot-accent"></span>New source</span>
          <span class="chip chip-neutral">Local · Daily</span>
        </div>
        <h1 class="source-title">{s.title}</h1>
        <div class="source-links">
          <a class="source-link" href="#demo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
            {s.homepage}
          </a>
          <a class="source-link" href="#demo">
            Review in Media Cloud
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
          </a>
        </div>
      </div>

      <!-- Metadata section -->
      <div class="meta-heading-row">
        <span class="meta-heading">Source metadata</span>
        <span class="meta-hint">Confirm each field, or click Edit to fix.</span>
      </div>
      <div class="meta-grid">
        {#each META as m, i}
          <div class="meta-cell" class:has-right-border={i < 2}>
            <div class="meta-label">{m.k}</div>
            <div class="meta-value">{m.v}</div>
            <div class="meta-actions">
              <label class="correct-label" class:correct-yes={m.ok}>
                <span class="checkbox" class:checked={m.ok}>
                  {#if m.ok}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
                  {/if}
                </span>
                Correct
              </label>
              <button class="btn btn-sm">Edit</button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Decision dock -->
      <div class="decision-dock">
        <span class="dock-label">Decide</span>
        <button class="dock-btn dock-remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          Remove
          <kbd class="kbd">R</kbd>
        </button>
        <button class="dock-btn dock-skip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 4 8 8-8 8M14 4v16"/></svg>
          Skip for now
          <kbd class="kbd">S</kbd>
        </button>
        <button class="dock-btn dock-keep">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
          Keep
          <kbd class="kbd kbd-light">K · ↵</kbd>
        </button>
      </div>
    </div>

    <!-- Right: sidebar -->
    <div class="sidebar">
      <!-- Guidelines card -->
      <div class="card">
        <div class="sidebar-card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="header-icon"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></svg>
          <span class="sidebar-card-title">Guidelines</span>
        </div>
        <p class="guidelines-body">Set by your project lead. Open the side panel to read in full while you review.</p>
        <div class="guidelines-list">
          {#each [
            { b: 'Keep',   color: '#E25C40', t: 'sources that fit the project criteria' },
            { b: 'Remove', color: '#1A1C1F', t: 'sources that do not' },
            { b: 'Skip',   color: '#9CA0A8', t: 'unsure — leave a note for the lead' },
          ] as g}
            <div class="guideline-row">
              <span class="guideline-verb" style:color={g.color}>{g.b}</span>
              <span class="guideline-text">{g.t}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Status card -->
      <div class="card">
        <div class="sidebar-card-header-plain">
          <span class="sidebar-card-title">Status</span>
        </div>
        <div class="status-grid">
          {#each SIDEBAR_STATUS as x}
            <div class="status-cell">
              <div class="status-label">
                <span class="status-dot" style:background={x.color}></span>
                {x.l}
              </div>
              <div class="status-val" style:color={x.color}>{x.n}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .review-page {
    width: 100%;
    min-height: 880px;
    background: var(--v2-bg);
    color: var(--v2-ink);
    font-family: var(--v2-sans);
    padding-bottom: 36px;
  }

  /* ── Action bar ── */
  .action-bar-wrap { padding: 34px 40px 0; }
  .action-bar {
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,.84);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
  }
  .action-divider { height: 18px; width: 1px; background: var(--v2-line); flex-shrink: 0; }
  .action-spacer { flex: 1; }

  .progress-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 12px;
    background: var(--v2-surface);
    border: 1px solid var(--v2-line);
    border-radius: 8px;
    font-size: 13.5px;
    margin-left: 6px;
  }
  .progress-current { font-weight: 600; font-family: var(--v2-mono); }
  .progress-sep { color: var(--v2-mute); }
  .progress-mini-track {
    width: 120px; height: 5px;
    background: var(--v2-line-soft);
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-mini-fill {
    width: 62%; height: 100%;
    background: var(--v2-accent);
  }
  .progress-pct-sm { color: var(--v2-mute); font-family: var(--v2-mono); font-size: 14px; }

  /* ── Main grid ── */
  .main-grid {
    padding: 34px 40px 0;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    align-items: flex-start;
  }

  /* ── Card ── */
  .card {
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
    overflow: hidden;
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
  .btn-sm { padding: 7px 12px; font-size: 12.5px; }

  /* ── Source header ── */
  .source-header { padding: 24px 28px 8px; }
  .chips-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13.5px; font-weight: 500;
  }
  .chip-accent  { background: var(--v2-accent-soft); color: var(--v2-accent-ink); }
  .chip-neutral { background: var(--v2-neutral);     color: var(--v2-body);       }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .chip-dot-accent { background: var(--v2-accent); }

  .source-title {
    font-size: 44px; font-weight: 600;
    letter-spacing: -1.2px; line-height: 1.02;
    margin: 0; color: var(--v2-ink);
  }
  .source-links {
    display: flex;
    align-items: center;
    gap: 22px;
    margin-top: 12px;
    font-size: 13.5px;
    flex-wrap: wrap;
  }
  .source-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--v2-accent); text-decoration: none; font-weight: 500;
  }
  .source-link:hover { text-decoration: underline; }

  /* ── Metadata ── */
  .meta-heading-row {
    border-top: 1px solid var(--v2-line-soft);
    margin-top: 18px;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .meta-heading { font-size: 16px; font-weight: 600; }
  .meta-hint { font-size: 13.5px; color: var(--v2-mute); }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--v2-line-soft);
  }
  .meta-cell { padding: 18px 22px; }
  .meta-cell.has-right-border { border-right: 1px solid var(--v2-line-soft); }

  .meta-label {
    font-size: 14px; color: var(--v2-mute);
    letter-spacing: .5px; text-transform: uppercase; font-weight: 500;
  }
  .meta-value { font-size: 15px; font-weight: 600; letter-spacing: -0.4px; margin-top: 6px; }
  .meta-actions {
    margin-top: 14px;
    display: flex; align-items: center; justify-content: space-between;
  }

  .correct-label {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 14px; color: var(--v2-body); cursor: pointer;
  }
  .correct-label.correct-yes { color: var(--v2-accent-ink); }

  .checkbox {
    width: 15px; height: 15px; border-radius: 4px;
    background: #fff;
    border: 1.5px solid var(--v2-line);
    display: grid; place-items: center; flex-shrink: 0;
  }
  .checkbox.checked {
    background: var(--v2-accent);
    border-color: var(--v2-accent);
  }

  /* ── Decision dock ── */
  .decision-dock {
    padding: 16px 22px;
    border-top: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dock-label {
    font-size: 14px; color: var(--v2-mute);
    letter-spacing: .5px; text-transform: uppercase; font-weight: 500;
    margin-right: 6px; white-space: nowrap; flex-shrink: 0;
  }
  .dock-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 13px 14px; border-radius: 12px;
    font-family: var(--v2-sans); font-size: 14px; font-weight: 500; cursor: pointer;
  }
  .dock-remove {
    background: #fff; border: 1px solid var(--v2-removed-soft);
    color: var(--v2-removed);
  }
  .dock-skip {
    background: #fff; border: 1px solid var(--v2-skipped-soft);
    color: var(--v2-skipped);
  }
  .dock-keep {
    flex: 1.4;
    background: var(--v2-kept); border: none; color: #fff;
    font-weight: 600;
    box-shadow: 0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.18);
  }
  .kbd {
    padding: 1.5px 6px;
    background: rgba(0,0,0,.07);
    border-radius: 4px; font-size: 12.5px;
    font-family: var(--v2-mono); font-weight: 500; color: inherit;
  }
  .kbd-light { background: rgba(255,255,255,.22); color: #fff; }

  /* ── Sidebar ── */
  .sidebar { display: flex; flex-direction: column; gap: 16px; }

  .sidebar-card-header {
    padding: 12px 18px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex; align-items: center; gap: 8px;
  }
  .sidebar-card-header-plain {
    padding: 12px 18px;
    border-bottom: 1px solid var(--v2-line-soft);
  }
  .sidebar-card-title { font-size: 15.5px; font-weight: 600; }
  .header-icon { color: var(--v2-accent); }

  .guidelines-body {
    padding: 12px 18px;
    font-size: 14px; color: var(--v2-body); line-height: 1.5; margin: 0;
  }
  .guidelines-list { padding: 0 18px 14px; display: flex; flex-direction: column; gap: 6px; }
  .guideline-row { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
  .guideline-verb { font-weight: 600; min-width: 50px; }
  .guideline-text { color: var(--v2-body); }

  .status-grid {
    padding: 14px 18px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .status-cell {
    padding: 10px 12px;
    background: var(--v2-surface);
    border-radius: 10px;
    border: 1px solid var(--v2-line-soft);
  }
  .status-label {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12.5px; color: var(--v2-mute);
    text-transform: uppercase; letter-spacing: .6px; font-weight: 500;
  }
  .status-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .status-val {
    font-size: 15px; font-weight: 600;
    letter-spacing: -0.5px; font-family: var(--v2-mono); margin-top: 4px;
  }
</style>
