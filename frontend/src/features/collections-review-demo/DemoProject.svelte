<script>
  import { get } from 'svelte/store';
  import Nav from './Nav.svelte';
  import DecisionBar from './DecisionBar.svelte';
  import { MOCK } from './mockData.js';
  import { reviewState, sessionCounts, saveGuidelines, downloadCSV } from './mockStore.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  const p = MOCK.project;

  const DECISIONS = [
    { k: 'kept',    label: 'Kept',    color: '#E25C40' },
    { k: 'removed', label: 'Removed', color: '#1A1C1F' },
    { k: 'added',   label: 'Added',   color: '#F5A48A' },
    { k: 'skipped', label: 'Skipped', color: '#9CA0A8' },
  ];

  const QUEUE_STATS = [
    { k: 'kept',    color: '#E25C40' },
    { k: 'removed', color: '#1A1C1F' },
    { k: 'added',   color: '#F5A48A' },
    { k: 'skipped', color: '#9CA0A8' },
  ];

  let highlight = null;
  let showSettings = false;

  function queueTotals(q) {
    return { reviewed: q.done, kept: q.kept, removed: q.removed, added: q.added, skipped: q.skipped, undecided: q.undecided };
  }
  function queuePct(q) { return q.total > 0 ? q.done / q.total : 0; }

  // ── Copy reviewer link ────────────────────────────────────────────────────
  let copiedIdx = null;
  function copyLink(url, idx) {
    navigator.clipboard.writeText(url);
    copiedIdx = idx;
    setTimeout(() => copiedIdx = null, 2000);
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  let csvToast = '';
  function exportCSV(type) {
    downloadCSV(type, get(reviewState));
    csvToast = type === 'audit' ? 'Audit CSV downloaded' : 'Project CSV downloaded';
    setTimeout(() => csvToast = '', 2000);
  }

  // ── Guidelines (Settings modal) ──────────────────────────────────────────
  let localGuidelines = get(reviewState).guidelines;
  let guidelinesSaved = false;
  function handleSaveSettings() {
    saveGuidelines(localGuidelines);
    guidelinesSaved = true;
    setTimeout(() => { guidelinesSaved = false; showSettings = false; }, 1200);
  }
</script>

<div class="project-page">
  <Nav
    role="project"
    projectCtx="Climate · US East Coast"
    {onNavigate}
    variant={navVariant}
    onTab={(t) => { if (t === 'Settings') showSettings = true; }}
  />

  <!-- ── HERO ── -->
  <div class="hero">
    <div class="breadcrumb">
      <button class="breadcrumb-link" on:click={() => onNavigate('/demo/manage')}>Projects</button>
    </div>
    <div class="hero-body">
      <div class="hero-left">
        <h1 class="hero-h1">
          Climate Reporting <span class="mute">· US East Coast</span>
        </h1>
        <div class="chips-row">
          <span class="chip chip-neutral">{p.queues.length} reviewer queues</span>
          <span class="chip chip-neutral">{p.seed.length} seed collections</span>
        </div>
        <p class="about-tool">
          <span class="about-label">About this project. </span>
          Seed collections are split into reviewer queues that you share by link. As reviewers decide each source, their
          <b class="about-kept"> Keep</b> / <b class="about-removed">Remove</b> / <b class="about-skipped">Skip</b> calls roll up here. When you're satisfied, publish the kept set back to a Media Cloud collection.
        </p>
      </div>
      <div class="hero-actions">
        <button class="btn" on:click={() => exportCSV('project')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>
          Project CSV
        </button>
        <button class="btn" on:click={() => exportCSV('audit')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/></svg>
          Audit CSV
        </button>
        <button class="btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview publish
        </button>
        <button class="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>
          Publish
        </button>
      </div>
    </div>
  </div>

  <!-- ── STATS CARD ── -->
  <div class="section-pad">
    <div class="card">
      <!-- Summary row -->
      <div class="stats-header">
        <div>
          <div class="stats-label">Reviewed</div>
          <div class="stats-count">
            {p.totals.reviewed.toLocaleString()}<span class="stats-total"> / {(p.totals.reviewed + p.totals.undecided).toLocaleString()}</span>
          </div>
        </div>
        <div class="stats-right">
          <div class="stats-undecided"><b class="mono-num">{p.totals.undecided.toLocaleString()}</b> undecided</div>
          <div class="stats-pct">{Math.round(p.progress * 100)}% complete</div>
        </div>
      </div>

      <!-- Stacked bar -->
      <div class="stats-bar-wrap">
        <DecisionBar totals={p.totals} height={16} {highlight} />
      </div>

      <!-- Decision buttons -->
      <div class="decision-grid">
        {#each DECISIONS as d}
          <button
            class="decision-btn"
            style:border-color={highlight === d.k ? d.color : 'var(--v2-line)'}
            style:background={highlight === d.k ? `${d.color}0e` : '#fff'}
            on:mouseenter={() => highlight = d.k}
            on:mouseleave={() => highlight = null}
            on:focus={() => highlight = d.k}
            on:blur={() => highlight = null}
          >
            <div>
              <div class="decision-label">
                <span class="decision-swatch" style:background={d.color}></span>
                {d.label}
              </div>
              <div class="decision-count">{p.totals[d.k].toLocaleString()}</div>
            </div>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
              style:color={highlight === d.k ? d.color : 'var(--v2-mute)'}
              style:transition="color .2s"
            ><path d="M7 17 17 7M9 7h8v8"/></svg>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- ── SEED COLLECTIONS ── -->
  <div class="section-pad-sm">
    <div class="card">
      <div class="seed-row">
        <div class="seed-label-col">
          <span class="seed-label">Seed collections</span>
        </div>
        <div class="seed-content">
          <div class="seed-chips">
            {#each p.seed as s}
              <span class="seed-chip">{s}</span>
            {/each}
            <button class="btn btn-sm">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add
            </button>
          </div>
          <p class="seed-hint">These are the Media Cloud collections the project was created from. They were used to pull in the starting set of sources for review.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── REVIEWER QUEUES ── -->
  <div class="queues-section">
    <div class="queues-divider"></div>
    <div class="queues-header">
      <span class="queues-title">Reviewer queues</span>
      <button class="btn btn-sm">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Generate queue
      </button>
    </div>

    <div class="queues-list">
      {#each p.queues as q, i}
        {@const pct = queuePct(q)}
        {@const done = q.total > 0 && q.done === q.total}
        {@const unassigned = q.done === 0}
        <div class="queue-card">
          <!-- Queue header -->
          <div class="queue-header">
            <div class="queue-id-row">
              <span class="queue-id">{q.id}</span>
              <span class="queue-pct">{Math.round(pct * 100)}%</span>
            </div>
            {#if done}
              <span class="chip chip-skipped"><span class="chip-dot chip-dot-skipped"></span>Completed</span>
            {:else if unassigned}
              <span class="chip chip-warn"><span class="chip-dot chip-dot-warn"></span>Unassigned</span>
            {/if}
          </div>

          <!-- Stat strip -->
          <div class="queue-stats">
            <span class="qstat"><b class="mono-num">{q.total}</b> <span class="mute">total</span></span>
            {#each QUEUE_STATS as s}
              <span class="qstat">
                <span class="qstat-dot" style:background={s.color}></span>
                <b class="mono-num">{q[s.k]}</b>
                <span class="mute">{s.k}</span>
              </span>
            {/each}
          </div>

          <!-- Progress bar -->
          <div class="queue-bar">
            <DecisionBar totals={queueTotals(q)} height={6} />
          </div>

          <!-- Footer -->
          <div class="queue-footer">
            <button class="btn btn-sm" on:click={() => copyLink(q.url, i)}>
              {#if copiedIdx === i}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
                Copied ✓
              {:else}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
                Copy reviewer link
              {/if}
            </button>
            <div class="queue-footer-spacer"></div>
            <button class="btn btn-primary btn-sm" on:click={() => onNavigate('/demo/review-projects/proj_8fa221/queues/q1')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
              Open landing
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- ── SETTINGS MODAL ── -->
{#if csvToast}
  <div class="toast">{csvToast}</div>
{/if}

{#if showSettings}
  <div class="modal-overlay" on:click={() => showSettings = false} role="dialog" aria-modal="true">
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <div>
          <div class="modal-title">Project settings</div>
          <div class="modal-subtitle">Change what reviewers see or whether they can edit source metadata. Updates apply to every queue in this project.</div>
        </div>
        <button class="modal-close" on:click={() => showSettings = false}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-title">Project name</div>
            <div class="setting-desc">Display name used across admin and reviewer views.</div>
          </div>
          <div class="setting-control">
            <input class="setting-input" type="text" value="Climate Reporting · US East Coast" />
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-title">Annotation guidelines</div>
            <div class="setting-desc">Markdown shown to reviewers while they work. Saving replaces the default for all queues.</div>
          </div>
          <div class="setting-control">
            <textarea class="setting-textarea" rows="5" bind:value={localGuidelines}></textarea>
          </div>
        </div>
        <div class="setting-row setting-row-toggle">
          <div class="setting-info">
            <div class="setting-title">Reviewer landing: project virtual queues</div>
            <div class="setting-desc">Show project-wide virtual-queue links (kept / removed / added / skipped) on reviewer landing pages.</div>
          </div>
          <div class="toggle toggle-on">
            <div class="toggle-knob toggle-knob-on"></div>
          </div>
        </div>
        <div class="setting-row setting-row-toggle">
          <div class="setting-info">
            <div class="setting-title">Source metadata editing</div>
            <div class="setting-desc">Require reviewers to confirm language and country/state before they can Keep a source.</div>
          </div>
          <div class="toggle toggle-off">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        {#if guidelinesSaved}<span class="saved-note">Saved ✓</span>{/if}
        <button class="btn" on:click={() => showSettings = false}>Cancel</button>
        <button class="btn btn-primary" on:click={handleSaveSettings}>Save changes</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Page shell ── */
  .project-page {
    width: 100%;
    min-height: 920px;
    background: var(--v2-bg);
    color: var(--v2-ink);
    font-family: var(--v2-sans);
    padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 32px 72px 0; }
  .breadcrumb { font-size: 13.5px; color: var(--v2-mute); font-family: var(--v2-mono); margin-bottom: 10px; }
  .breadcrumb-link {
    background: none; border: none; padding: 0; cursor: pointer;
    color: var(--v2-ink); font-size: 13.5px; font-family: var(--v2-mono);
  }
  .breadcrumb-link:hover { text-decoration: underline; }

  .hero-body {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 22px;
  }
  .hero-left { max-width: 820px; }
  .hero-h1 {
    font-size: 46px;
    font-weight: 600;
    letter-spacing: -1.5px;
    margin: 0;
    line-height: 1.04;
    color: var(--v2-ink);
  }
  .mute { color: var(--v2-mute); }

  .chips-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans);
  }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }
  .chip-skipped { background: var(--v2-skipped-soft); color: var(--v2-body); }
  .chip-warn    { background: var(--v2-warn-soft); color: var(--v2-warn); }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .chip-dot-skipped { background: var(--v2-skipped); }
  .chip-dot-warn    { background: var(--v2-warn); }

  .about-tool {
    margin: 18px 0 0;
    max-width: 760px;
    font-size: 15.5px;
    line-height: 1.6;
    color: var(--v2-body);
  }
  .about-label { font-weight: 500; color: var(--v2-ink); }
  .about-kept    { color: var(--v2-kept);    font-weight: 600; }
  .about-removed { color: var(--v2-removed); font-weight: 600; }
  .about-skipped { color: var(--v2-skipped); font-weight: 600; }

  .hero-actions { display: flex; gap: 8px; flex-shrink: 0; }

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

  /* ── Card ── */
  .card {
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
    overflow: hidden;
  }
  .section-pad    { padding: 36px 72px 0; }
  .section-pad-sm { padding: 32px 72px 0; }

  /* ── Stats card ── */
  .stats-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 22px;
  }
  .stats-label { font-size: 16px; color: var(--v2-body); font-weight: 500; }
  .stats-count {
    font-size: 34px;
    font-weight: 600;
    letter-spacing: -1px;
    font-family: var(--v2-mono);
    margin-top: 2px;
    color: var(--v2-ink);
  }
  .stats-total { font-size: 15px; color: var(--v2-mute); font-weight: 400; }
  .stats-right { text-align: right; }
  .stats-undecided { font-size: 16px; color: var(--v2-body); }
  .mono-num { font-family: var(--v2-mono); font-weight: 600; color: var(--v2-ink); }
  .stats-pct { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); margin-top: 4px; }

  .stats-bar-wrap { padding: 18px 22px 12px; }

  .decision-grid {
    padding: 4px 14px 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
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
  .decision-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: var(--v2-body);
    font-weight: 500;
  }
  .decision-swatch {
    width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0;
  }
  .decision-count {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.7px;
    font-family: var(--v2-mono);
    margin-top: 4px;
    color: var(--v2-ink);
  }

  /* ── Seed collections ── */
  .seed-row {
    padding: 16px 22px;
    display: flex;
    align-items: flex-start;
    gap: 24px;
  }
  .seed-label-col { flex-shrink: 0; padding-top: 4px; width: 104px; }
  .seed-label {
    font-size: 12.5px;
    color: var(--v2-mute);
    letter-spacing: .6px;
    text-transform: uppercase;
    font-weight: 600;
    line-height: 1.3;
  }
  .seed-content { flex: 1; min-width: 0; }
  .seed-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .seed-chip {
    padding: 6px 14px;
    background: var(--v2-line-soft);
    border-radius: 999px;
    font-size: 13.5px;
    color: var(--v2-body);
    border: 1px solid var(--v2-line);
  }
  .seed-hint {
    font-size: 12px;
    color: #9A9CA2;
    margin: 12px 0 0;
    line-height: 1.5;
  }

  /* ── Reviewer queues ── */
  .queues-section { padding: 40px 72px 0; }
  .queues-divider { height: 1px; background: var(--v2-line); margin-bottom: 32px; }
  .queues-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 4px 4px 12px;
  }
  .queues-title { font-size: 16px; font-weight: 600; }
  .queues-list { display: flex; flex-direction: column; gap: 26px; }

  .queue-card {
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
    overflow: hidden;
  }
  .queue-header {
    padding: 14px 18px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .queue-id-row { display: flex; align-items: center; gap: 10px; }
  .queue-id { font-size: 16px; font-weight: 600; }
  .queue-pct { font-size: 13.5px; color: var(--v2-mute); font-family: var(--v2-mono); }

  .queue-stats {
    padding: 0 18px 10px;
    display: flex;
    gap: 22px;
    font-size: 13.5px;
    color: var(--v2-body);
    flex-wrap: wrap;
  }
  .qstat { display: inline-flex; align-items: center; gap: 5px; }
  .qstat-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }

  .queue-bar { padding: 0 18px 14px; }

  .queue-footer {
    padding: 12px 18px 14px;
    border-top: 1px solid var(--v2-line-soft);
    background: var(--v2-surface);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .queue-footer-spacer { flex: 1; }

  /* ── Settings modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(20,23,30,.42);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 56px 24px;
    overflow-y: auto;
  }
  .modal {
    width: 100%;
    max-width: 680px;
    background: var(--v2-card);
    border-radius: 18px;
    border: 1px solid var(--v2-line);
    box-shadow: 0 30px 70px -24px rgba(20,23,30,.45);
    overflow: hidden;
    flex-shrink: 0;
  }
  .modal-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }
  .modal-title { font-size: 19px; font-weight: 600; color: var(--v2-ink); }
  .modal-subtitle { font-size: 13.5px; color: var(--v2-mute); margin-top: 3px; }
  .modal-close {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid var(--v2-line); background: #fff;
    color: var(--v2-body); cursor: pointer;
    display: grid; place-items: center; flex-shrink: 0;
  }

  .modal-body { padding: 8px 24px 20px; }
  .setting-row {
    padding: 18px 0;
    border-top: 1px solid var(--v2-line-soft);
  }
  .setting-row:first-child { border-top: none; }
  .setting-row-toggle {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }
  .setting-info { flex: 1; }
  .setting-title { font-size: 14.5px; font-weight: 600; color: var(--v2-ink); }
  .setting-desc  { font-size: 13px; color: var(--v2-mute); margin-top: 2px; line-height: 1.5; }
  .setting-control { margin-top: 10px; }
  .setting-input {
    width: 100%;
    border: 1px solid var(--v2-line);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: var(--v2-sans);
    color: var(--v2-ink);
    outline: none;
  }
  .setting-textarea {
    width: 100%;
    border: 1px solid var(--v2-line);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13.5px;
    font-family: var(--v2-mono);
    color: var(--v2-body);
    outline: none;
    resize: vertical;
    line-height: 1.5;
  }

  .toggle {
    width: 34px; height: 20px; border-radius: 999px; position: relative;
    cursor: pointer; flex-shrink: 0; margin-top: 2px;
  }
  .toggle-off { background: var(--v2-line-soft); }
  .toggle-on  { background: var(--v2-accent); }
  .toggle-knob {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px;
    background: #fff; border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0,0,0,.18);
  }
  .toggle-knob-on { left: 16px; }

  .modal-footer {
    padding: 14px 24px;
    border-top: 1px solid var(--v2-line-soft);
    background: var(--v2-surface);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .saved-note {
    margin-right: auto;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--v2-accent-ink);
  }

  /* ── CSV toast ── */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 10px 20px; border-radius: 999px;
    background: var(--v2-ink); color: #fff;
    font-size: 14px; font-weight: 500; font-family: var(--v2-sans);
    box-shadow: 0 8px 24px -8px rgba(0,0,0,.28);
    z-index: 200;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
</style>
