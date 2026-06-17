<script>
  import { onMount, onDestroy } from 'svelte';
  import Nav from './Nav.svelte';
  import Modal from './Modal.svelte';
  import HelpModal from './HelpModal.svelte';
  import { projectsStore, inProgressProjects, completedProjects, KNOWN_COLLECTIONS, addProject } from './mockStore.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';

  /* ── QuickReviewCard state ── */
  const SAMPLES = ['34412803', '29571100', '18204455', '42119007'];

  let qrId = '';
  let qrFocused = false;
  let qrAuto = '';
  let qrIdx = 0;
  let qrTimer = null;
  let qrStarted = false; // shows "not found" feedback after pressing Start

  $: qrInfo = KNOWN_COLLECTIONS[qrId] || null;
  $: qrResolved = !!qrInfo;
  $: qrNotFound = qrId.length === 8 && !qrInfo;
  $: qrShowAuto = !qrFocused && qrId === '';
  $: qrDisplay = qrShowAuto ? qrAuto : qrId;
  $: qrBorderColor = qrResolved ? 'var(--v2-kept)' : (qrNotFound || (qrStarted && !qrResolved)) ? 'var(--v2-red)' : 'var(--v2-line)';

  function stepAuto() {
    if (qrFocused || qrId !== '') return;
    const sample = SAMPLES[qrIdx];
    if (qrAuto.length < sample.length) {
      qrAuto = sample.slice(0, qrAuto.length + 1);
      qrTimer = setTimeout(stepAuto, 160);
    } else {
      qrTimer = setTimeout(() => {
        qrAuto = '';
        qrIdx = (qrIdx + 1) % SAMPLES.length;
        stepAuto();
      }, 1700);
    }
  }

  function onQrFocus() { qrFocused = true; clearTimeout(qrTimer); }
  function onQrBlur() { qrFocused = false; qrTimer = setTimeout(stepAuto, 300); }
  function onQrType(e) {
    qrId = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    qrStarted = false;
  }

  function startReview() {
    qrStarted = true;
    if (qrResolved) onNavigate('/demo/reviews/124');
  }

  onMount(() => { qrTimer = setTimeout(stepAuto, 500); });
  onDestroy(() => clearTimeout(qrTimer));

  /* ── Metadata toggle ── */
  let metadataEditing = false;

  /* ── Help modal ── */
  let showHelp = false;

  /* ── New project modal ── */
  let showNewProject = false;
  let newProjectName = '';
  let newGuidelineTemplate = 'default';
  let newCollectionSource = 'manual'; // 'manual' | 'geographic'
  let newCollectionIds = '';
  let newCountry = '';

  const GUIDELINE_TEMPLATES = [
    { value: 'default',   label: 'Default (keep reliable local reporting)' },
    { value: 'climate',   label: 'Climate journalism' },
    { value: 'local',     label: 'Local news' },
    { value: 'ai-sweep',  label: 'AI content review' },
  ];
  const COUNTRIES = ['United States', 'Brazil', 'United Kingdom', 'Germany', 'France', 'India', 'Mexico', 'Nigeria', 'Kenya', 'South Africa'];

  function submitNewProject() {
    if (!newProjectName.trim()) return;
    const seeds = newCollectionSource === 'manual'
      ? newCollectionIds.split(',').map(s => s.trim()).filter(Boolean)
      : newCountry ? [newCountry] : [];
    addProject(newProjectName.trim(), seeds);
    showNewProject = false;
    newProjectName = '';
    newCollectionIds = '';
    newCountry = '';
    newCollectionSource = 'manual';
    newGuidelineTemplate = 'default';
    onNavigate('/demo/review-projects/proj_8fa221');
  }

  /* ── Projects pagination (10 per page, newest first) ── */
  let projectsPage = 0;
  $: projectsTotal = $projectsStore.length;
  $: projectsStart = projectsPage * 10;
  $: projectsEnd   = Math.min(projectsStart + 10, projectsTotal);
  $: projectsItems = $projectsStore.slice(projectsStart, projectsEnd);
  $: hasPrevPage   = projectsPage > 0;
  $: hasNextPage   = projectsEnd < projectsTotal;

  /* ── See-all modals ── */
  let showAllInProgress = false;
  let showAllCompleted  = false;
</script>

<div class="home">
  <Nav role="admin" {onNavigate} variant={navVariant} />

  <!-- ─────────────── HERO ─────────────── -->
  <div class="hero">
    <div class="hero-grid">

      <!-- Left: heading + copy + CTA -->
      <div class="hero-left">
        <h1 class="hero-h1">
          Media&nbsp;Cloud<br/>
          Collections&nbsp;<span class="accent">Review&nbsp;Portal</span>.
        </h1>
        <p class="hero-body">
          Curate Media Cloud's news-source collections: keep what holds up, remove the noise, publish back when you're done.
        </p>
        <div class="hero-actions">
          <button class="btn btn-lg" on:click={() => showHelp = true}>How it works</button>
        </div>
      </div>

      <!-- Right: QuickReviewCard -->
      <div class="qrc">
        <!-- Card header -->
        <div class="qrc-header">
          <div class="qrc-header-left">
            <div class="qrc-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>
            </div>
            <span class="qrc-title">Start a quick review</span>
          </div>
          <span class="chip chip-neutral">Single collection</span>
        </div>

        <p class="qrc-hint">Enter a collection ID to begin.</p>

        <!-- ID input -->
        <div class="qrc-input-wrap">
          <div class="qrc-input-label">Collection ID</div>
          <div class="qrc-input-row" style:border-color={qrBorderColor}>
            <div class="qrc-input-inner">
              <input
                class="qrc-input"
                class:auto={qrShowAuto}
                value={qrDisplay}
                inputmode="numeric"
                placeholder="paste a collection ID…"
                on:focus={onQrFocus}
                on:blur={onQrBlur}
                on:input={onQrType}
              />
              {#if qrShowAuto}
                <span class="qrc-caret" style:left="calc({qrDisplay.length}ch + 2px)"></span>
              {/if}
            </div>

            {#if qrResolved}
              <span class="qrc-found">
                <span class="qrc-found-dot">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5l9-11"/></svg>
                </span>
                Found
              </span>
            {/if}
            {#if qrNotFound || (qrStarted && !qrResolved && qrId.length > 0)}
              <span class="qrc-not-found">Not found</span>
            {/if}
          </div>

          <!-- Resolved confirmation panel -->
          <div class="qrc-confirm" class:visible={qrResolved}>
            {#if qrInfo}
              <div class="qrc-confirm-inner">
                <div>
                  <div class="qrc-confirm-name">{qrInfo.name}</div>
                  <div class="qrc-confirm-sub">Collection found · ready to queue</div>
                </div>
                <div class="qrc-confirm-count">
                  <div class="qrc-confirm-num">~{qrInfo.sources}</div>
                  <div class="qrc-confirm-unit">sources</div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Options row -->
        <div class="qrc-options">
          <div class="qrc-option-box">
            <div class="qrc-option-label">Metadata editing</div>
            <button class="qrc-option-val-row" on:click={() => metadataEditing = !metadataEditing}>
              <span class="qrc-option-val">{metadataEditing ? 'On' : 'Off'}</span>
              <div class="toggle" class:toggle-on={metadataEditing} class:toggle-off={!metadataEditing}>
                <div class="toggle-knob"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- Card footer -->
        <div class="qrc-footer">
          <span class="qrc-footer-hint">
            {#if qrResolved}Queue starts with ~{qrInfo.sources} sources{:else if qrStarted && !qrResolved && qrId.length > 0}<span class="hint-err">Collection not found — try a different ID</span>{:else}&nbsp;{/if}
          </span>
          <button class="btn btn-primary" on:click={startReview}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            Start review
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ─────────────── DIVIDER ─────────────── -->
  <div class="section-divider-wrap">
    <div class="section-divider"></div>
  </div>

  <!-- ─────────────── /01 PROJECTS ─────────────── -->
  <div class="section-header">
    <div class="section-header-left">
      <span class="section-num">/01</span>
      <h2 class="section-title">Review projects</h2>
    </div>
    <div class="section-header-actions">
      <button class="btn" on:click={() => showNewProject = true}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        New project
      </button>
    </div>
  </div>

  <div class="card-wrap">
    <div class="card">
      <!-- Table header -->
      <div class="projects-thead">
        <div></div>
        <div>Project</div>
        <div>Queues</div>
        <div>Progress</div>
        <div></div>
      </div>
      <!-- Table rows -->
      {#each projectsItems as r}
        <button
          class="projects-row"
          on:click={() => onNavigate(`/demo/review-projects/${r.guid}`)}
        >
          <div class="project-avatar">{r.name[0]}</div>
          <div class="project-meta">
            <div class="project-name">{r.name}</div>
            <div class="project-seeds">{r.seeds} seed {r.seeds === 1 ? 'collection' : 'collections'}</div>
          </div>
          <div class="project-queues">{r.queueCount} reviewer {r.queueCount === 1 ? 'queue' : 'queues'}</div>
          <div class="project-progress">
            <div class="progress-track">
              <div
                class="progress-fill"
                class:fill-done={r.progress >= 1}
                style:width="{r.progress * 100}%"
              ></div>
            </div>
            <span class="progress-pct">{Math.round(r.progress * 100)}%</span>
          </div>
          <div class="project-arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
          </div>
        </button>
      {/each}
    </div>
  </div>
  {#if projectsTotal > 10}
  <div class="pagination">
    <button class="btn btn-sm" disabled={!hasPrevPage} on:click={() => projectsPage--}>← Previous</button>
    <span class="pagination-counter">{projectsStart + 1}–{projectsEnd} of {projectsTotal}</span>
    <button class="btn btn-sm" disabled={!hasNextPage} on:click={() => projectsPage++}>Next 10 →</button>
  </div>
  {/if}

  <!-- ─────────────── LOWER CARDS ─────────────── -->
  <div class="lower-section">

    <!-- /02 In-progress -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-left">
          <span class="section-num">/02</span>
          <span class="card-title">In-progress reviews</span>
        </div>
        <button class="btn btn-sm" on:click={() => showAllInProgress = true}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
          See all
        </button>
      </div>
      {#each $inProgressProjects.slice(0, 5) as r, i}
        <button
          class="review-row"
          class:first={i === 0}
          on:click={() => onNavigate('/demo/reviews/124')}
        >
          <div class="review-info">
            <div class="review-name">{r.name}</div>
            <div class="review-id">{r.seeds} seed collections · {r.queueCount} {r.queueCount === 1 ? 'queue' : 'queues'}</div>
          </div>
          <div class="review-progress">
            <div class="progress-track">
              <div class="progress-fill fill-ink" style:width="{r.progress * 100}%"></div>
            </div>
            <span class="progress-pct">{Math.round(r.progress * 100)}%</span>
          </div>
          <div class="review-action">
            <button class="btn btn-sm" on:click|stopPropagation={() => onNavigate('/demo/reviews/124')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              Resume
            </button>
          </div>
        </button>
      {/each}
    </div>

    <!-- /03 Completed -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-left">
          <span class="section-num">/03</span>
          <span class="card-title">Completed reviews</span>
        </div>
        <button class="btn btn-sm" on:click={() => showAllCompleted = true}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
          See all
        </button>
      </div>
      {#each $completedProjects.slice(0, 5) as r, i}
        <div class="completed-row" class:first={i === 0}>
          <div class="review-info">
            <div class="review-name">{r.name}</div>
            <div class="review-id">{r.closedAt}</div>
          </div>
          <span class="chip chip-skipped">
            <span class="chip-dot chip-dot-skipped"></span>
            Closed
          </span>
        </div>
      {/each}
    </div>

  </div>
</div>

<!-- ─────────────── MODALS ─────────────── -->

<HelpModal show={showHelp} role="admin" on:close={() => showHelp = false} />

<!-- New project -->
<Modal show={showNewProject} title="Start review project" on:close={() => showNewProject = false}>
  <p class="modal-subtitle">Seed a multi-collection project into reviewer queues.</p>
  <form class="modal-form" on:submit|preventDefault={submitNewProject}>

    <div class="form-field">
      <label class="form-label" for="proj-guideline">Annotation Guidelines Template</label>
      <select id="proj-guideline" class="form-select" bind:value={newGuidelineTemplate}>
        {#each GUIDELINE_TEMPLATES as t}
          <option value={t.value}>{t.label}</option>
        {/each}
      </select>
    </div>

    <div class="form-field">
      <label class="form-label" for="proj-name">Project Name</label>
      <input
        id="proj-name"
        class="form-input"
        bind:value={newProjectName}
        placeholder="e.g. UNDP 2026 Seed Project"
        required
        autocomplete="off"
      />
    </div>

    <div class="form-field">
      <div class="form-label">Collection source</div>
      <div class="radio-group">
        <label class="radio-option" class:radio-selected={newCollectionSource === 'manual'}>
          <input type="radio" bind:group={newCollectionSource} value="manual" />
          <div class="radio-text">
            <span class="radio-label">Manual collection IDs</span>
            <span class="radio-hint">Enter Media Cloud collection IDs directly</span>
          </div>
        </label>
        <label class="radio-option" class:radio-selected={newCollectionSource === 'geographic'}>
          <input type="radio" bind:group={newCollectionSource} value="geographic" />
          <div class="radio-text">
            <span class="radio-label">Geographic (MediaCloud country list)</span>
            <span class="radio-hint">Select a country to seed from its top-online list</span>
          </div>
        </label>
      </div>
    </div>

    {#if newCollectionSource === 'manual'}
      <div class="form-field">
        <label class="form-label" for="proj-ids">MediaCloud Collection IDs</label>
        <input
          id="proj-ids"
          class="form-input"
          bind:value={newCollectionIds}
          placeholder="e.g. 123, 456, 789"
          autocomplete="off"
        />
        <div class="form-hint">Separate multiple IDs with commas.</div>
      </div>
    {:else}
      <div class="form-field">
        <label class="form-label" for="proj-country">Country</label>
        <select id="proj-country" class="form-select" bind:value={newCountry}>
          <option value="">Select a country…</option>
          {#each COUNTRIES as c}
            <option value={c}>{c}</option>
          {/each}
        </select>
      </div>
    {/if}

    <button
      class="btn btn-primary btn-full"
      type="submit"
      disabled={!newProjectName.trim()}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Start review project
    </button>
  </form>
</Modal>

<!-- All in-progress -->
<Modal show={showAllInProgress} title="In-progress reviews" on:close={() => showAllInProgress = false}>
  <div class="modal-list">
    {#each $inProgressProjects as r, i}
      <button
        class="modal-row"
        class:first={i === 0}
        on:click={() => { showAllInProgress = false; onNavigate('/demo/reviews/124'); }}
      >
        <div class="review-info">
          <div class="review-name">{r.name}</div>
          <div class="review-id">{r.seeds} seed collections · {r.queueCount} {r.queueCount === 1 ? 'queue' : 'queues'}</div>
        </div>
        <div class="review-progress modal-progress">
          <div class="progress-track">
            <div class="progress-fill fill-ink" style:width="{r.progress * 100}%"></div>
          </div>
          <span class="progress-pct">{Math.round(r.progress * 100)}%</span>
        </div>
      </button>
    {/each}
  </div>
</Modal>

<!-- All completed -->
<Modal show={showAllCompleted} title="Completed reviews" on:close={() => showAllCompleted = false}>
  <div class="modal-list">
    {#each $completedProjects as r, i}
      <div class="modal-row" class:first={i === 0}>
        <div class="review-info">
          <div class="review-name">{r.name}</div>
          <div class="review-id">{r.closedAt}</div>
        </div>
        <div class="modal-row-right">
          <span class="chip chip-skipped"><span class="chip-dot chip-dot-skipped"></span>Closed</span>
        </div>
      </div>
    {/each}
  </div>
</Modal>

<style>
  /* ── Page shell ── */
  .home {
    width: 100%;
    min-height: 920px;
    background: var(--v2-bg);
    color: var(--v2-ink);
    font-family: var(--v2-sans);
    padding-bottom: 36px;
  }

  /* ── Hero ── */
  .hero { padding: 48px 120px 18px; }
  .hero-grid {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 36px;
    align-items: start;
  }
  .hero-left { display: flex; flex-direction: column; }
  .hero-h1 {
    font-size: 66px;
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -2.2px;
    margin: 0;
    color: var(--v2-ink);
  }
  .accent { color: var(--v2-accent); }
  .hero-body {
    max-width: 480px;
    font-size: 17px;
    color: var(--v2-body);
    line-height: 1.6;
    margin: 22px 0 0;
  }
  .hero-actions { display: flex; gap: 10px; margin-top: 24px; align-items: center; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 999px;
    background: var(--v2-card); color: var(--v2-ink);
    border: 1px solid var(--v2-line);
    font-family: var(--v2-sans); font-size: 13.5px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
    transition: opacity .15s;
  }
  .btn-primary {
    background: var(--v2-ink); color: #fff; border: none;
    box-shadow: 0 1px 0 rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.18);
  }
  .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .btn-ghost { background: transparent; border-color: transparent; box-shadow: none; }
  .btn-lg { padding: 12px 22px; font-size: 15px; }
  .btn-sm { padding: 7px 12px; font-size: 12.5px; }

  /* ── QuickReviewCard ── */
  .qrc {
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 16px;
    padding: 0;
    box-shadow: 0 18px 50px -28px rgba(0,0,0,.16);
    overflow: hidden;
  }
  .qrc-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--v2-line-soft);
    display: flex; align-items: center; justify-content: space-between;
  }
  .qrc-header-left { display: flex; align-items: center; gap: 10px; }
  .qrc-icon {
    width: 26px; height: 26px; border-radius: 8px;
    background: var(--v2-accent-soft); color: var(--v2-accent);
    display: grid; place-items: center;
  }
  .qrc-title { font-size: 15px; font-weight: 600; }
  .qrc-hint { padding: 12px 22px 0; font-size: 13px; color: var(--v2-mute); margin: 0; }
  .qrc-input-wrap { padding: 14px 22px 8px; }
  .qrc-input-label {
    font-size: 13px; color: var(--v2-mute); letter-spacing: .5px;
    text-transform: uppercase; font-weight: 500; margin-bottom: 6px;
  }
  .qrc-input-row {
    padding: 11px 14px; border-radius: 12px;
    display: flex; align-items: center; gap: 10px;
    border: 1.5px solid var(--v2-line);
    transition: border-color .25s ease;
  }
  .qrc-input-inner { position: relative; flex: 1; display: flex; align-items: baseline; min-width: 0; }
  .qrc-input {
    flex: 1; min-width: 0; width: 100%;
    border: none; outline: none; background: transparent; padding: 0;
    font-family: var(--v2-mono); font-size: 22px; font-weight: 500;
    color: var(--v2-ink); letter-spacing: -0.3px;
  }
  .qrc-input.auto { color: var(--v2-mute); }
  .qrc-caret {
    position: absolute; top: 0.18em;
    width: 2px; height: 1.2em; background: var(--v2-ink);
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }

  .qrc-found { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--v2-kept); font-weight: 600; white-space: nowrap; }
  .qrc-found-dot {
    width: 17px; height: 17px; border-radius: 50%; background: var(--v2-kept); color: #fff;
    display: grid; place-items: center; flex-shrink: 0;
  }
  .qrc-not-found { font-size: 14px; color: var(--v2-red); font-weight: 500; white-space: nowrap; }

  .qrc-confirm {
    overflow: hidden; max-height: 0; opacity: 0; margin-top: 0;
    transition: max-height .35s ease, opacity .35s ease, margin .35s ease;
  }
  .qrc-confirm.visible { max-height: 70px; opacity: 1; margin-top: 10px; }
  .qrc-confirm-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px;
    background: var(--v2-kept-soft); border: 1px solid rgba(226,92,64,.2); border-radius: 12px;
  }
  .qrc-confirm-name { font-size: 13.5px; font-weight: 600; color: var(--v2-ink); }
  .qrc-confirm-sub { font-size: 13.5px; color: var(--v2-accent-ink); margin-top: 1px; }
  .qrc-confirm-count { text-align: right; }
  .qrc-confirm-num { font-size: 14px; font-weight: 600; font-family: var(--v2-mono); letter-spacing: -0.5px; color: var(--v2-ink); }
  .qrc-confirm-unit { font-size: 12.5px; color: var(--v2-mute); text-transform: uppercase; letter-spacing: .5px; font-weight: 500; }

  .qrc-options { padding: 12px 22px 4px; }
  .qrc-option-box { padding: 10px 12px; border: 1px solid var(--v2-line); border-radius: 12px; background: #fff; }
  .qrc-option-label { font-size: 14px; color: var(--v2-mute); letter-spacing: .5px; text-transform: uppercase; font-weight: 500; }
  .qrc-option-val {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 6px; font-size: 13.5px; font-weight: 500; color: var(--v2-ink);
  }
  .qrc-option-val-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 6px; background: none; border: none; padding: 0; cursor: pointer; width: 100%;
    font-family: var(--v2-sans); font-size: 13.5px; font-weight: 500; color: var(--v2-ink);
  }

  /* Toggle */
  .toggle {
    width: 32px; height: 18px; border-radius: 999px;
    position: relative; flex-shrink: 0;
    border: 1px solid var(--v2-line);
    transition: background .2s;
  }
  .toggle-off { background: var(--v2-neutral); }
  .toggle-on  { background: var(--v2-accent); border-color: var(--v2-accent); }
  .toggle-knob {
    position: absolute; top: 1px; left: 1px;
    width: 14px; height: 14px; background: #fff;
    border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,.15);
    transition: left .2s;
  }
  .toggle-on .toggle-knob { left: calc(100% - 15px); }

  .qrc-footer {
    padding: 12px 22px 14px; border-top: 1px solid var(--v2-line-soft); margin-top: 12px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .qrc-footer-hint { font-size: 13px; color: var(--v2-mute); }
  .hint-err { color: var(--v2-red); font-weight: 500; }

  /* ── Chips ── */
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 13.5px; font-weight: 500; font-family: var(--v2-sans);
  }
  .chip-neutral { background: var(--v2-neutral); color: var(--v2-body); }
  .chip-skipped { background: var(--v2-skipped-soft); color: var(--v2-body); }
  .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .chip-dot-skipped { background: var(--v2-skipped); }

  /* ── Section divider ── */
  .section-divider-wrap { padding: 40px 120px 0; }
  .section-divider { height: 1px; background: var(--v2-line); }

  /* ── Section heading ── */
  .section-header { padding: 28px 120px 8px; display: flex; align-items: flex-end; justify-content: space-between; }
  .section-header-left { display: flex; align-items: baseline; gap: 14px; }
  .section-num { font-size: 14px; font-family: var(--v2-mono); color: var(--v2-mute); font-weight: 500; }
  .section-title { margin: 0; font-size: 29px; font-weight: 600; letter-spacing: -0.6px; color: var(--v2-ink); }
  .section-header-actions { display: flex; gap: 8px; }

  /* ── Card wrapper ── */
  .card-wrap { padding: 14px 120px 0; }
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }

  /* ── Projects table ── */
  .projects-thead {
    display: grid; grid-template-columns: 42px 1.6fr 1fr 1.1fr 30px;
    font-size: 16px; color: var(--v2-mute); font-weight: 500;
    letter-spacing: .5px; text-transform: uppercase;
    padding: 14px 22px 10px; gap: 14px; align-items: center;
  }
  .projects-row {
    display: grid; grid-template-columns: 42px 1.6fr 1fr 1.1fr 30px;
    align-items: center; padding: 14px 22px;
    border-top: 1px solid var(--v2-line-soft);
    cursor: pointer; gap: 14px;
    background: transparent; border-left: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left; font-family: var(--v2-sans); color: var(--v2-ink);
    transition: background .12s;
  }
  .projects-row:hover { background: var(--v2-line-soft); }

  .project-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--v2-accent-soft); color: var(--v2-accent);
    display: grid; place-items: center;
    font-weight: 600; font-size: 14.5px; flex-shrink: 0;
  }
  .project-avatar.sm { width: 28px; height: 28px; font-size: 13px; flex-shrink: 0; }
  .project-meta { min-width: 0; }
  .project-name { font-size: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .project-seeds { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); margin-top: 1px; }
  .project-queues { font-size: 16px; color: var(--v2-body); }

  .project-progress { display: flex; align-items: center; gap: 8px; }
  .progress-track { flex: 1; height: 5px; background: var(--v2-line-soft); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--v2-accent); transition: width .3s; }
  .progress-fill.fill-done { background: var(--v2-skipped); }
  .progress-fill.fill-ink  { background: var(--v2-ink); }
  .progress-pct { font-size: 14px; color: var(--v2-body); font-family: var(--v2-mono); min-width: 36px; text-align: right; }
  .project-arrow { text-align: right; color: var(--v2-mute); }

  /* ── Pagination ── */
  .pagination {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 22px 0;
    font-family: var(--v2-sans);
  }
  .pagination-counter { font-size: 13.5px; color: var(--v2-mute); font-family: var(--v2-mono); flex: 1; text-align: center; }
  .btn:disabled { opacity: .35; cursor: not-allowed; pointer-events: none; }

  /* ── Lower section ── */
  .lower-section { padding: 44px 120px 0; display: flex; flex-direction: column; gap: 44px; }

  .card-header { padding: 14px 22px; border-bottom: 1px solid var(--v2-line-soft); display: flex; align-items: center; justify-content: space-between; }
  .card-header-left { display: flex; align-items: baseline; gap: 14px; }
  .card-title { font-size: 17.5px; font-weight: 600; color: var(--v2-ink); }

  .review-row {
    padding: 14px 22px; display: grid; grid-template-columns: 1.6fr 1fr 90px; gap: 14px;
    align-items: center; border-top: 1px solid var(--v2-line-soft);
    cursor: pointer; background: transparent;
    border-left: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left; font-family: var(--v2-sans); color: var(--v2-ink);
    transition: background .12s;
  }
  .review-row.first { border-top: none; }
  .review-row:hover { background: var(--v2-line-soft); }

  .review-info { min-width: 0; }
  .review-name { font-size: 15.5px; font-weight: 500; }
  .review-id { font-size: 15px; color: var(--v2-mute); font-family: var(--v2-mono); margin-top: 1px; }
  .review-progress { display: flex; align-items: center; gap: 8px; }
  .review-action { text-align: right; }

  .completed-row {
    padding: 12px 22px; display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--v2-line-soft);
  }
  .completed-row.first { border-top: none; }

  /* ── Modal content ── */
  .modal-subtitle {
    padding: 0 24px 4px;
    font-size: 14px; color: var(--v2-mute); font-family: var(--v2-sans);
    margin: 0;
  }
  .modal-form { padding: 16px 24px 24px; font-family: var(--v2-sans); }
  .form-field { margin-bottom: 18px; }
  .form-label { display: block; font-size: 12px; color: var(--v2-mute); text-transform: uppercase; letter-spacing: .6px; font-weight: 600; margin-bottom: 7px; }
  .form-input, .form-select {
    width: 100%; padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid var(--v2-line, #e8e9eb); background: #fff;
    font-family: var(--v2-sans); font-size: 14.5px; color: var(--v2-ink);
    outline: none; box-sizing: border-box;
    transition: border-color .2s;
    appearance: none; -webkit-appearance: none;
  }
  .form-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA0A8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .form-input:focus, .form-select:focus { border-color: var(--v2-accent); }
  .form-hint { font-size: 12.5px; color: var(--v2-mute); margin-top: 5px; }

  .radio-group { display: flex; flex-direction: column; gap: 8px; }
  .radio-option {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px; border-radius: 10px;
    border: 1.5px solid var(--v2-line, #e8e9eb);
    cursor: pointer; transition: border-color .15s, background .15s;
  }
  .radio-option input[type="radio"] { accent-color: var(--v2-accent); margin-top: 3px; flex-shrink: 0; }
  .radio-option:hover { background: var(--v2-line-soft, #f5f5f7); }
  .radio-selected { border-color: var(--v2-accent); background: var(--v2-accent-soft, #fdf1ee); }
  .radio-text { display: flex; flex-direction: column; gap: 2px; }
  .radio-label { font-size: 14px; font-weight: 500; color: var(--v2-ink); }
  .radio-hint  { font-size: 13px; color: var(--v2-mute); }

  .btn-full { width: 100%; justify-content: center; border-radius: 12px; padding: 13px 22px; font-size: 15px; margin-top: 4px; }

  .modal-list { padding: 0 6px 8px; }
  .modal-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 13px 18px; border-top: 1px solid var(--v2-line-soft, #f0f0f0);
    cursor: pointer; background: transparent;
    border-left: none; border-right: none; border-bottom: none;
    width: 100%; text-align: left; font-family: var(--v2-sans); color: var(--v2-ink);
    transition: background .12s; border-radius: 8px; box-sizing: border-box;
  }
  .modal-row:is(div) { cursor: default; }
  .modal-row.first { border-top: none; }
  .modal-row:is(button):hover { background: #f8f8f8; }
  .modal-row .review-info { flex: 1; min-width: 0; }
  .modal-row-right { display: flex; align-items: center; flex-shrink: 0; padding-left: 8px; }
  .modal-progress { flex-shrink: 0; width: 140px; }
  .pct-badge { font-size: 13.5px; font-family: var(--v2-mono); color: var(--v2-mute); }
</style>
