<script>
  import Nav from './Nav.svelte';
  import { projectsStore } from './mockStore.js';

  export let onNavigate = () => {};
  export let navVariant = 'glass';
</script>

<div class="page">
  <Nav role="all-projects" {onNavigate} variant={navVariant} />

  <div class="section-header">
    <h1 class="section-title">All Projects</h1>
    <span class="section-count">{$projectsStore.length} projects</span>
  </div>

  <div class="card-wrap">
    <div class="card">
      <div class="projects-thead">
        <div></div>
        <div>Project</div>
        <div>Queues</div>
        <div>Progress</div>
        <div></div>
      </div>
      {#each $projectsStore as r}
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

  .section-header {
    padding: 36px 72px 12px;
    display: flex;
    align-items: baseline;
    gap: 16px;
  }
  .section-title {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.8px;
    margin: 0;
    color: var(--v2-ink);
  }
  .section-count {
    font-size: 14px;
    color: var(--v2-mute);
    font-family: var(--v2-mono);
  }

  .card-wrap { padding: 0 72px; }
  .card { background: var(--v2-card); border: 1px solid var(--v2-line); border-radius: 16px; overflow: hidden; }

  .projects-thead {
    display: grid; grid-template-columns: 42px 1.6fr 1fr 1.1fr 30px;
    font-size: 12px; color: var(--v2-mute); font-weight: 600;
    letter-spacing: .6px; text-transform: uppercase;
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
  .project-meta { min-width: 0; }
  .project-name { font-size: 14.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .project-seeds { font-size: 14px; color: var(--v2-mute); font-family: var(--v2-mono); margin-top: 1px; }
  .project-queues { font-size: 14.5px; color: var(--v2-body); }

  .project-progress { display: flex; align-items: center; gap: 8px; }
  .progress-track { flex: 1; height: 5px; background: var(--v2-line-soft); border-radius: 999px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--v2-accent); transition: width .3s; }
  .progress-fill.fill-done { background: var(--v2-skipped); }
  .progress-pct { font-size: 14px; color: var(--v2-body); font-family: var(--v2-mono); min-width: 36px; text-align: right; }
  .project-arrow { text-align: right; color: var(--v2-mute); }
</style>
