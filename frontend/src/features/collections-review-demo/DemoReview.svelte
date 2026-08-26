<script>
  import Nav from './Nav.svelte';
  import {
    reviewState, sessionCounts, decisionsStore,
    QUEUE_SOURCES,
    decideSource, redecideCurrentSource, proposeSource, saveSourceMeta, navigateToSource,
  } from './mockStore.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  // ── Current source ────────────────────────────────────────────────────────
  $: src = QUEUE_SOURCES[$reviewState.sourceIdx] ?? null;
  $: allDone = src === null;

  // Whether this source has already been decided (navigated back with Prev)
  $: q1Decisions = $decisionsStore['proj_8fa221']?.['Queue #1'] ?? [];
  $: currentDecision = src ? (q1Decisions.find(d => d.source === src.title) ?? null) : null;

  // Merge store meta-overrides onto the static source record.
  $: meta = src ? [
    { k: 'language', label: 'Language',    v: ($reviewState.metaOverrides[src.id]?.language ?? src.language) },
    { k: 'country',  label: 'Pub country', v: ($reviewState.metaOverrides[src.id]?.country  ?? src.country)  },
    { k: 'state',    label: 'Pub state',   v: ($reviewState.metaOverrides[src.id]?.state    ?? src.state)    },
  ] : [];

  // ── Metadata editing ──────────────────────────────────────────────────────
  let editingField = null;
  let editVal = '';

  function startEdit(field) { editingField = field.k; editVal = field.v; }
  function saveEdit() {
    if (!src || !editingField) return;
    saveSourceMeta(src.id, { [editingField]: editVal });
    editingField = null;
  }
  function cancelEdit() { editingField = null; }

  let confirmedFields = {};
  $: if ($reviewState.sourceIdx || $reviewState.sourceIdx === 0) {
    editingField    = null;
    confirmedFields = {};
  }

  function toggleConfirm(k) {
    confirmedFields = { ...confirmedFields, [k]: !confirmedFields[k] };
  }
  $: isConfirmed = (k) => confirmedFields[k] ?? (k !== 'state');

  // ── Reason modal (Fix 5) ─────────────────────────────────────────────────
  // Keep and Remove require a reason before committing.
  let reasonModal = null; // { pendingVerdict: 'keep' | 'remove' }
  let reasonText = '';
  $: reasonVerbLabel = reasonModal?.pendingVerdict === 'keep' ? 'Keep' : 'Remove';
  $: reasonCanConfirm = reasonText.trim().length > 0;

  function openReasonModal(verdict) {
    reasonModal = { pendingVerdict: verdict };
    reasonText  = currentDecision?.reason ?? '';
  }

  function cancelReason() {
    reasonModal = null;
    reasonText  = '';
  }

  function confirmReason() {
    if (!reasonCanConfirm) return;
    const reason = reasonText.trim();
    const v = reasonModal.pendingVerdict;
    if (currentDecision !== null) {
      redecideCurrentSource(v, reason);
    } else {
      decideSource(v, reason);
    }
    reasonModal = null;
    reasonText  = '';
  }

  // ── Decisions ─────────────────────────────────────────────────────────────
  // Keep/Remove open reason modal; Skip is immediate.
  function keep()   { openReasonModal('keep'); }
  function remove() { openReasonModal('remove'); }
  function skip() {
    if (currentDecision !== null) {
      redecideCurrentSource('skip', null);
    } else {
      decideSource('skip', null);
    }
  }

  // Keyboard shortcuts
  function onKey(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (allDone || reasonModal) return;
    if (e.key === 'k' || e.key === 'Enter') keep();
    if (e.key === 'r') remove();
    if (e.key === 's') skip();
    if (e.key === 'ArrowLeft' && $reviewState.sourceIdx > 0) navigateToSource($reviewState.sourceIdx - 1);
    if (e.key === 'ArrowRight' && $reviewState.sourceIdx < QUEUE_SOURCES.length - 1) navigateToSource($reviewState.sourceIdx + 1);
  }

  // ── Propose-new-source modal ──────────────────────────────────────────────
  let showPropose = false;
  let proposeLabel = '';
  let proposeUrl = '';
  let proposeToast = '';

  function submitPropose() {
    if (!proposeLabel.trim() || !proposeUrl.trim()) return;
    proposeSource(proposeLabel.trim(), proposeUrl.trim());
    proposeLabel = '';
    proposeUrl = '';
    showPropose = false;
    proposeToast = 'Source added — it appears in Added.';
    setTimeout(() => proposeToast = '', 2500);
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="review-page">
  <Nav role="queue" projectCtx="Climate Reporting · US East Coast" projectGuid="proj_8fa221" queueGuid="q1" {onNavigate} variant={navVariant} />

  <!-- ── ALL-DONE STATE ─────────────────────────────────────────────────── -->
  {#if allDone}
    <div class="done-wrap">
      <div class="done-card">
        <div class="done-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
        </div>
        <h2 class="done-h2">Queue complete</h2>
        <p class="done-sub">You've reviewed all {QUEUE_SOURCES.length} sources in this demo session.</p>
        <div class="done-tally">
          {#each [
            { l: 'Kept',    n: $sessionCounts.totalKept,    c: '#E25C40' },
            { l: 'Removed', n: $sessionCounts.totalRemoved, c: '#1A1C1F' },
            { l: 'Skipped', n: $sessionCounts.totalSkipped, c: '#9CA0A8' },
            { l: 'Added',   n: $sessionCounts.totalAdded,   c: '#F5A48A' },
          ] as t}
            <div class="done-stat">
              <span class="done-dot" style:background={t.c}></span>
              <span class="done-n" style:color={t.c}>{t.n}</span>
              <span class="done-l">{t.l}</span>
            </div>
          {/each}
        </div>
        <!-- Fix 2: primary = Back to review at last source; secondary = decisions page -->
        <div class="done-actions">
          <button class="btn btn-primary" on:click={() => { navigateToSource(QUEUE_SOURCES.length - 1); onNavigate('/demo/reviews/124'); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg)"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            Back to review
          </button>
          <button class="btn" on:click={() => onNavigate('/demo/review-projects/proj_8fa221/queues/q1/decisions')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="m2 14 10 5 10-5M2 11l10 5 10-5"/></svg>
            Check all decisions
          </button>
        </div>
      </div>
    </div>

  {:else}
    <!-- ── ACTION BAR ──────────────────────────────────────────────────── -->
    <div class="action-bar-wrap">
      <div class="action-bar">
        <button class="btn btn-sm" on:click={() => onNavigate('/demo/review-projects/proj_8fa221/queues/q1')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg)"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          Back to queue
        </button>
        <div class="action-divider"></div>

        <div class="progress-pill">
          <span class="progress-current">{$reviewState.sourceIdx + 1}</span>
          <span class="progress-sep">/ {QUEUE_SOURCES.length}</span>
          <div class="progress-mini-track">
            <div class="progress-mini-fill" style:width="{Math.round(($reviewState.sourceIdx + 1) / QUEUE_SOURCES.length * 100)}%"></div>
          </div>
          <span class="progress-pct-label">{Math.round(($reviewState.sourceIdx + 1) / QUEUE_SOURCES.length * 100)}%</span>
        </div>

        <div class="action-spacer"></div>

        <button class="btn btn-sm" on:click={() => onNavigate('/demo/review-projects/proj_8fa221/queues/q1/decisions')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 8l10 5 10-5z"/><path d="m2 14 10 5 10-5M2 11l10 5 10-5"/></svg>
          All decisions · {$sessionCounts.totalDecided}
        </button>
        <button class="btn btn-primary btn-sm" on:click={() => showPropose = true}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Propose new source
        </button>
      </div>
    </div>

    <!-- ── TWO-COLUMN LAYOUT ───────────────────────────────────────────── -->
    <div class="main-grid">

      <!-- Source card -->
      <div class="card">
        <!-- Source header -->
        <div class="source-header">
          <div class="source-header-row">
            <div class="source-header-left">
              <h1 class="source-title">{src.title}</h1>
              {#if currentDecision}
                {@const VCOLORS = { kept: '#E25C40', removed: '#1A1C1F', added: '#F5A48A', skipped: '#9CA0A8' }}
                {@const VLABELS = { kept: 'Kept', removed: 'Removed', added: 'Added', skipped: 'Skipped' }}
                <div class="chips-row">
                  <span class="chip chip-decided" style:background="{VCOLORS[currentDecision.verdict]}1a" style:color={VCOLORS[currentDecision.verdict]}>
                    <span class="chip-dot" style:background={VCOLORS[currentDecision.verdict]}></span>
                    {VLABELS[currentDecision.verdict]}
                  </span>
                </div>
              {/if}
              <div class="source-links">
                <span class="source-link-static">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                  {src.homepage}
                </span>
                <a class="source-link" href="https://{src.homepage}" target="_blank" rel="noreferrer">
                  Review in Media Cloud
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
                </a>
              </div>
              {#if currentDecision?.reason}
                <div class="prev-reason">Previous note: "{currentDecision.reason}"</div>
              {/if}
            </div>
            <div class="source-nav">
              <button
                class="nav-circle"
                disabled={$reviewState.sourceIdx === 0}
                on:click={() => navigateToSource($reviewState.sourceIdx - 1)}
                aria-label="Previous source"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                class="nav-circle"
                disabled={$reviewState.sourceIdx >= QUEUE_SOURCES.length - 1}
                on:click={() => navigateToSource($reviewState.sourceIdx + 1)}
                aria-label="Next source"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Metadata section -->
        <div class="meta-heading-row">
          <span class="meta-heading">Source metadata</span>
          <span class="meta-hint">Confirm each field, or click Edit to fix.</span>
        </div>
        <div class="meta-grid">
          {#each meta as field, i}
            <div class="meta-cell" class:has-right-border={i < 2}>
              <div class="meta-label">{field.label}</div>

              {#if editingField === field.k}
                <input
                  class="meta-edit-input"
                  bind:value={editVal}
                  on:keydown={e => e.key === 'Enter' && saveEdit()}
                />
                <div class="meta-edit-actions">
                  <button class="btn btn-sm btn-accent" on:click={saveEdit}>Save</button>
                  <button class="btn btn-sm" on:click={cancelEdit}>Cancel</button>
                </div>
              {:else}
                <div class="meta-value">{field.v}</div>
                <div class="meta-actions">
                  <button
                    class="correct-label"
                    class:correct-yes={isConfirmed(field.k)}
                    on:click={() => toggleConfirm(field.k)}
                  >
                    <span class="checkbox" class:checked={isConfirmed(field.k)}>
                      {#if isConfirmed(field.k)}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
                      {/if}
                    </span>
                    Correct
                  </button>
                  <button class="btn btn-sm" on:click={() => startEdit(field)}>Edit</button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="meta-local-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          "Correct" is a session-only toggle — no backend write path exists yet (see BACKEND-GAPS.md). "Edit" writes to mock state.
        </div>

        <!-- Decision dock -->
        <div class="decision-dock">
          <span class="dock-label">Decide</span>
          <button
            class="dock-btn dock-remove"
            class:dock-active-remove={currentDecision?.verdict === 'removed'}
            on:click={remove}
          >
            Remove
            <kbd class="kbd">R</kbd>
          </button>
          <button
            class="dock-btn dock-skip"
            class:dock-active-skip={currentDecision?.verdict === 'skipped'}
            on:click={skip}
          >
            Skip
            <kbd class="kbd">S</kbd>
          </button>
          <button
            class="dock-btn dock-keep"
            class:dock-active-keep={currentDecision?.verdict === 'kept'}
            on:click={keep}
          >
            Keep
            <kbd class="kbd kbd-light">K · ↵</kbd>
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">

        <!-- Guidelines card -->
        <div class="card">
          <div class="sidebar-card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="header-icon"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></svg>
            <span class="sidebar-card-title">Guidelines</span>
          </div>
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
            {#each [
              { l: 'kept',    n: $sessionCounts.totalKept,    color: '#E25C40' },
              { l: 'removed', n: $sessionCounts.totalRemoved, color: '#1A1C1F' },
              { l: 'skipped', n: $sessionCounts.totalSkipped, color: '#9CA0A8' },
              { l: 'added',   n: $sessionCounts.totalAdded,   color: '#F5A48A' },
            ] as x}
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

        <!-- Source position -->
        <div class="position-note">
          Source {$reviewState.sourceIdx + 1} of {QUEUE_SOURCES.length} in this demo session
        </div>

      </div>
    </div>
  {/if}

  <!-- ── REASON MODAL (Fix 5 — required for Keep / Remove) ──────────────── -->
  {#if reasonModal}
    <div class="modal-overlay" on:click={cancelReason} role="dialog" aria-modal="true">
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <div>
            <div class="modal-title" style:color={reasonModal.pendingVerdict === 'keep' ? '#E25C40' : '#1A1C1F'}>
              {reasonVerbLabel}: {src?.title}
            </div>
            <div class="modal-subtitle">Provide a reason before confirming — it will appear in the decisions list and audit CSV.</div>
          </div>
          <button class="modal-close" on:click={cancelReason}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label class="field-label" for="reason-input">
              Reason <span class="required-star">*</span>
            </label>
            <textarea
              id="reason-input"
              class="reason-textarea"
              bind:value={reasonText}
              placeholder="Why are you {reasonModal.pendingVerdict === 'keep' ? 'keeping' : 'removing'} this source?"
              rows="4"
              autofocus
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" on:click={cancelReason}>Cancel</button>
          <button
            class="btn btn-primary"
            class:btn-dim={!reasonCanConfirm}
            style:background={reasonModal.pendingVerdict === 'keep' ? '#E25C40' : '#1A1C1F'}
            on:click={confirmReason}
          >
            Confirm {reasonVerbLabel}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ── PROPOSE NEW SOURCE MODAL ──────────────────────────────────────── -->
  {#if showPropose}
    <div class="modal-overlay" on:click={() => showPropose = false} role="dialog" aria-modal="true">
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <div>
            <div class="modal-title">Propose a new source</div>
            <div class="modal-subtitle">The source will be added to the project's Added list for review.</div>
          </div>
          <button class="modal-close" on:click={() => showPropose = false}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label class="field-label">Source name</label>
            <input class="field-input" bind:value={proposeLabel} placeholder="e.g. Maryland Matters" />
          </div>
          <div class="field-group">
            <label class="field-label">Website URL</label>
            <input class="field-input" bind:value={proposeUrl} type="url" placeholder="e.g. marylandmatters.org" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" on:click={() => showPropose = false}>Cancel</button>
          <button
            class="btn btn-primary"
            class:btn-dim={!proposeLabel.trim() || !proposeUrl.trim()}
            on:click={submitPropose}
          >Add source</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ── TOAST ──────────────────────────────────────────────────────────── -->
  {#if proposeToast}
    <div class="toast">{proposeToast}</div>
  {/if}
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

  /* ── All-done state ── */
  .done-wrap {
    display: flex; align-items: center; justify-content: center;
    min-height: 70vh; padding: 40px;
  }
  .done-card {
    text-align: center;
    background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 20px;
    padding: 44px 52px; max-width: 480px;
  }
  .done-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--v2-accent); color: #fff;
    display: grid; place-items: center; margin: 0 auto 20px;
  }
  .done-h2  { font-size: 28px; font-weight: 600; letter-spacing: -0.7px; margin: 0 0 8px; }
  .done-sub { font-size: 15px; color: var(--v2-body); margin: 0 0 28px; line-height: 1.5; }
  .done-tally { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 28px; }
  .done-stat  { display: flex; align-items: center; gap: 6px; font-size: 15px; }
  .done-dot   { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .done-n     { font-weight: 600; font-family: var(--v2-mono); }
  .done-l     { color: var(--v2-body); }
  .done-actions { display: flex; gap: 10px; justify-content: center; }

  /* ── Action bar ── */
  .action-bar-wrap { padding: 34px 120px 0; }
  .action-bar {
    padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,.84); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--v2-line); border-radius: 16px;
  }
  .action-divider { height: 18px; width: 1px; background: var(--v2-line); flex-shrink: 0; }
  .action-spacer  { flex: 1; }
  .progress-pill {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 12px; background: var(--v2-surface);
    border: 1px solid var(--v2-line); border-radius: 8px;
    font-size: 13.5px;
  }
  .progress-current { font-weight: 600; font-family: var(--v2-mono); }
  .progress-sep { color: var(--v2-mute); font-family: var(--v2-mono); }
  .progress-mini-track { width: 52px; height: 4px; background: var(--v2-line); border-radius: 999px; overflow: hidden; flex-shrink: 0; }
  .progress-mini-fill  { height: 100%; background: var(--v2-accent); border-radius: 999px; transition: width .2s; }
  .progress-pct-label  { font-size: 12.5px; color: var(--v2-mute); font-family: var(--v2-mono); min-width: 28px; }

  /* ── Main grid ── */
  .main-grid {
    padding: 34px 120px 0; display: grid;
    grid-template-columns: 1fr 340px; gap: 28px; align-items: flex-start;
  }

  /* ── Cards ── */
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }

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
  .btn[disabled] { opacity: .4; pointer-events: none; }
  .btn-primary { background: var(--v2-ink); color: #fff; border: none; box-shadow: 0 1px 0 rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.18); }
  .btn-accent  { background: var(--v2-accent); color: #fff; border: none; }
  .btn-sm      { padding: 7px 12px; font-size: 12.5px; }
  .btn-dim     { opacity: .5; pointer-events: none; }

  /* ── Source header ── */
  .source-header { padding: 24px 28px 8px; }
  .source-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .source-header-left { flex: 1; min-width: 0; }
  .source-nav { display: flex; gap: 8px; flex-shrink: 0; padding-top: 4px; }
  .nav-circle {
    width: 46px; height: 46px; border-radius: 50%;
    border: 1px solid var(--v2-line); background: var(--v2-card);
    color: var(--v2-body); cursor: pointer;
    display: grid; place-items: center;
    transition: border-color .15s, color .15s, background .15s;
    flex-shrink: 0;
  }
  .nav-circle:hover:not(:disabled) { border-color: var(--v2-accent); color: var(--v2-accent); background: var(--v2-surface); }
  .nav-circle:disabled { opacity: .35; cursor: not-allowed; }
  .chips-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px; font-size: 13.5px; font-weight: 500;
  }
  .chip-decided  { font-weight: 600; }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .source-title { font-size: 50px; font-weight: 600; letter-spacing: -1.2px; line-height: 1.02; margin: 0; color: var(--v2-ink); }
  .source-links { display: flex; align-items: center; gap: 22px; margin-top: 12px; font-size: 13.5px; flex-wrap: wrap; }
  .source-link-static { display: inline-flex; align-items: center; gap: 6px; color: var(--v2-body); }
  .source-link { display: inline-flex; align-items: center; gap: 6px; color: var(--v2-accent); text-decoration: none; font-weight: 500; }
  .source-link:hover { text-decoration: underline; }
  .prev-reason { margin-top: 8px; font-size: 13px; color: var(--v2-mute); font-style: italic; }

  /* ── Metadata ── */
  .meta-heading-row { border-top: 1px solid var(--v2-line-soft); margin-top: 18px; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; }
  .meta-heading { font-size: 18px; font-weight: 600; }
  .meta-hint    { font-size: 13.5px; color: var(--v2-mute); }
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--v2-line-soft); }
  .meta-cell { padding: 18px 22px; }
  .meta-cell.has-right-border { border-right: 1px solid var(--v2-line-soft); }
  .meta-label { font-size: 15.5px; color: var(--v2-mute); letter-spacing: .5px; text-transform: uppercase; font-weight: 500; }
  .meta-value { font-size: 16.5px; font-weight: 600; letter-spacing: -0.4px; margin-top: 6px; }
  .meta-actions { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; }
  .meta-edit-input { width: 100%; margin-top: 6px; padding: 7px 10px; border: 1.5px solid var(--v2-accent); border-radius: 8px; font-size: 15px; font-weight: 500; font-family: var(--v2-sans); outline: none; background: #fff; color: var(--v2-ink); }
  .meta-edit-actions { display: flex; gap: 6px; margin-top: 10px; }
  .correct-label { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; color: var(--v2-body); cursor: pointer; background: none; border: none; padding: 0; font-family: var(--v2-sans); }
  .correct-label.correct-yes { color: var(--v2-accent-ink); }
  .checkbox { width: 15px; height: 15px; border-radius: 4px; background: #fff; border: 1.5px solid var(--v2-line); display: grid; place-items: center; flex-shrink: 0; }
  .checkbox.checked { background: var(--v2-accent); border-color: var(--v2-accent); }
  .meta-local-note { padding: 8px 28px 14px; font-size: 12.5px; color: var(--v2-mute); display: flex; align-items: flex-start; gap: 6px; border-top: 1px solid var(--v2-line-soft); line-height: 1.5; }
  .meta-local-note svg { flex-shrink: 0; margin-top: 1px; }

  /* ── Decision dock ── */
  .decision-dock { padding: 16px 22px; display: flex; align-items: center; gap: 10px; }
  .dock-label { font-size: 14px; color: var(--v2-mute); letter-spacing: .5px; text-transform: uppercase; font-weight: 500; margin-right: 6px; white-space: nowrap; flex-shrink: 0; }
  .dock-btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 13px 14px; border-radius: 12px;
    font-family: var(--v2-sans); font-size: 15.5px; font-weight: 500; cursor: pointer;
    transition: opacity .12s, box-shadow .15s;
  }
  .dock-btn:hover  { opacity: .85; }
  .dock-btn:active { opacity: .7; transform: scale(.98); }
  .dock-remove { background: #fff; border: 1px solid var(--v2-removed-soft); color: var(--v2-removed); }
  .dock-skip   { background: #fff; border: 1px solid var(--v2-skipped-soft); color: var(--v2-skipped); }
  .dock-keep   { flex: 1.4; background: var(--v2-kept); border: none; color: #fff; font-weight: 600; box-shadow: 0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.18); }
  /* Active highlights for re-decide (Fix 3) */
  .dock-active-keep   { box-shadow: 0 0 0 3px rgba(226,92,64,.35), inset 0 1px 0 rgba(255,255,255,.18) !important; }
  .dock-active-remove { box-shadow: 0 0 0 3px rgba(26,28,31,.22) !important; background: #f4f4f4 !important; }
  .dock-active-skip   { box-shadow: 0 0 0 3px rgba(156,160,168,.35) !important; background: #f7f7f8 !important; }
  .kbd       { padding: 1.5px 6px; background: rgba(0,0,0,.07); border-radius: 4px; font-size: 12.5px; font-family: var(--v2-mono); font-weight: 500; color: inherit; }
  .kbd-light { background: rgba(255,255,255,.22); color: #fff; }

  /* ── Sidebar ── */
  .sidebar { display: flex; flex-direction: column; gap: 16px; }
  .sidebar-card-header { padding: 12px 18px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: center; gap: 8px; }
  .sidebar-card-header-plain { padding: 12px 18px; border-bottom: 1px solid var(--v2-line-soft); }
  .sidebar-card-title { font-size: 15.5px; font-weight: 600; }
  .header-icon { color: var(--v2-accent); }
  .guidelines-list { padding: 10px 18px 14px; display: flex; flex-direction: column; gap: 6px; }
  .guideline-row { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
  .guideline-verb { font-weight: 600; min-width: 50px; }
  .guideline-text { color: var(--v2-body); }
  .status-grid { padding: 14px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .status-cell { padding: 10px 12px; background: var(--v2-surface); border-radius: 10px; border: 1px solid var(--v2-line-soft); }
  .status-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--v2-mute); text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }
  .status-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
  .status-val { font-size: 15px; font-weight: 600; letter-spacing: -0.5px; font-family: var(--v2-mono); margin-top: 4px; transition: color .2s; }
  .position-note { font-size: 13px; color: var(--v2-mute); text-align: center; font-family: var(--v2-mono); padding: 0 4px; }

  /* ── Reason modal (Fix 5) ── */
  .reason-textarea {
    width: 100%; padding: 12px 14px; border-radius: 10px;
    border: 1.5px solid var(--v2-line); font-size: 15px; font-family: var(--v2-sans);
    color: var(--v2-ink); outline: none; resize: vertical; line-height: 1.5;
    background: var(--v2-surface);
  }
  .reason-textarea:focus { border-color: var(--v2-accent); }
  .required-star { color: var(--v2-accent); font-weight: 700; }

  /* ── Modals (shared) ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(20,23,30,.38);
    backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100;
  }
  .modal {
    background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 20px;
    width: 480px; max-width: 96vw; box-shadow: 0 24px 60px -20px rgba(0,0,0,.28); overflow: hidden;
  }
  .modal-header { padding: 20px 22px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .modal-title    { font-size: 16px; font-weight: 600; }
  .modal-subtitle { font-size: 13.5px; color: var(--v2-mute); margin-top: 4px; line-height: 1.4; }
  .modal-close    { background: none; border: none; cursor: pointer; color: var(--v2-mute); padding: 4px; border-radius: 6px; flex-shrink: 0; }
  .modal-body     { padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; }
  .modal-footer   { padding: 14px 22px; border-top: 1px solid var(--v2-line-soft); display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-size: 14px; font-weight: 500; color: var(--v2-body); }
  .field-input { padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--v2-line); font-size: 15px; font-family: var(--v2-sans); color: var(--v2-ink); outline: none; background: var(--v2-surface); }
  .field-input:focus { border-color: var(--v2-accent); }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 10px 20px; border-radius: 999px; background: var(--v2-ink); color: #fff;
    font-size: 14px; font-weight: 500; font-family: var(--v2-sans);
    box-shadow: 0 8px 24px -8px rgba(0,0,0,.28); z-index: 200;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
