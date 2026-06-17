<script>
  export let role = 'admin';
  export let projectCtx = null;
  export let projectGuid = null;
  export let queueGuid = null;
  export let onNavigate = () => {};
  export let variant = 'glass';
  export let onTab = () => {};

  $: tabs = role === 'project' ? [
    { n: 'Project Admin', to: `/demo/review-projects/${projectGuid}`, active: true },
    { n: 'Settings' },
    { n: 'All Decisions', to: `/demo/review-projects/${projectGuid}/decisions` },
  ] : role === 'all-decisions' ? [
    { n: 'Project Admin', to: `/demo/review-projects/${projectGuid}` },
    { n: 'Settings' },
    { n: 'All Decisions', to: `/demo/review-projects/${projectGuid}/decisions`, active: true },
  ] : role === 'queue' ? [
    { n: 'My queue', to: '/demo/reviews/124', active: true },
    { n: 'Decisions', to: `/demo/review-projects/${projectGuid}/queues/${queueGuid}/decisions` },
  ] : role === 'queue-decisions' ? [
    { n: 'My queue', to: '/demo/reviews/124' },
    { n: 'Decisions', to: `/demo/review-projects/${projectGuid}/queues/${queueGuid}/decisions`, active: true },
  ] : role === 'all-projects' ? [
    { n: 'General Admin', to: '/demo/manage' },
    { n: 'All Projects', to: '/demo/projects', active: true },
  ] : [
    { n: 'General Admin', to: '/demo/manage', active: true },
    { n: 'All Projects', to: '/demo/projects' },
  ];

  $: isGrey = variant === 'grey' || variant === 'print';
  $: isSticky = variant === 'glass';

  function logoClick() {
    if (role === 'queue' || role === 'queue-decisions') {
      onNavigate(`/demo/review-projects/${projectGuid}/queues/${queueGuid}`);
    } else {
      onNavigate('/demo/manage');
    }
  }
</script>

<div class="nav-wrap" class:sticky={isSticky}>
  <div class="nav-bar" class:glass={!isGrey} class:grey={isGrey}>
    <button class="nav-logo" on:click={logoClick}>
      <svg width="23" height="23" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="6" width="24" height="20" rx="2.5" stroke="currentColor" stroke-width="2.4"/>
        <path d="M8 19c1.6 0 2-1.2 2.8-3.4C11.5 13.7 12 10 13.3 10c1.4 0 1.8 4 2.7 6 .7 1.6 1.3 2.2 2.2 1 .7-.9 1.2-2 2-2 .9 0 1.3 1 1.8 1.6.5.5 1 .8 2 .8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="brand">Media Cloud</span><span class="brand-mute">&nbsp;·&nbsp;Collections Review Portal</span>
    </button>

    <div class="nav-divider"></div>

    <nav class="nav-tabs">
      {#each tabs as t}
        <button
          class="nav-tab"
          class:active={t.active}
          on:click={() => t.to ? onNavigate(t.to) : onTab(t.n)}
        >{t.n}</button>
      {/each}
    </nav>

    {#if projectCtx}
      <span class="project-ctx">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
        {projectCtx}
      </span>
    {/if}
  </div>
</div>

<style>
  .nav-wrap {
    padding: 14px 120px 0;
  }
  .nav-wrap.sticky {
    position: sticky;
    top: 10px;
    z-index: 30;
  }

  .nav-bar {
    border-radius: 999px;
    padding: 9px 16px 9px 22px;
    display: flex;
    align-items: center;
    gap: 22px;
  }

  .nav-bar.glass {
    background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 52%, rgba(255,255,255,0.10) 100%);
    color: var(--v2-nav-ink);
    backdrop-filter: blur(14px) saturate(170%);
    -webkit-backdrop-filter: blur(14px) saturate(170%);
    border: 1px solid rgba(255,255,255,.6);
    box-shadow:
      inset 0 1.5px 0.5px rgba(255,255,255,.98),
      inset 1px 0 1px rgba(255,255,255,.4),
      inset -1px 0 1px rgba(255,255,255,.4),
      inset 0 -10px 18px -10px rgba(255,255,255,.5),
      0 16px 40px -16px rgba(20,23,30,.32),
      0 2px 6px -3px rgba(20,23,30,.14);
  }

  .nav-bar.grey {
    background: #9C9A95;
    color: #fff;
    border: 1px solid rgba(255,255,255,.12);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 6px 18px -12px rgba(0,0,0,.3);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.2px;
    cursor: pointer;
    background: none;
    border: none;
    color: inherit;
    font-family: var(--v2-sans);
    padding: 0;
    white-space: nowrap;
  }

  .brand-mute {
    font-weight: 400;
    color: var(--v2-nav-mute);
  }
  .grey .brand-mute {
    color: rgba(255,255,255,0.72);
  }

  .nav-divider {
    height: 18px;
    width: 1px;
    flex-shrink: 0;
    background: rgba(20,23,30,.14);
  }
  .grey .nav-divider {
    background: rgba(255,255,255,.16);
  }

  .nav-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .nav-tab {
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 15.5px;
    font-weight: 400;
    background: transparent;
    color: var(--v2-nav-mute);
    border: none;
    cursor: pointer;
    font-family: var(--v2-sans);
  }
  .grey .nav-tab {
    color: rgba(255,255,255,0.72);
  }

  .nav-tab.active {
    font-weight: 600;
    color: var(--v2-nav-ink);
    background: rgba(255,255,255,.7);
    box-shadow: 0 1px 3px rgba(20,23,30,.14), inset 0 1px 0 rgba(255,255,255,.95);
  }
  .grey .nav-tab.active {
    color: #fff;
    background: rgba(255,255,255,.28);
    box-shadow: none;
  }

  .project-ctx {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13.5px;
    color: var(--v2-nav-mute);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .grey .project-ctx {
    color: rgba(255,255,255,0.72);
  }
</style>
