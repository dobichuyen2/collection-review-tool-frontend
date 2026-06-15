<script>
  import DemoHome from './DemoHome.svelte';
  import DemoProject from './DemoProject.svelte';
  import DemoQueueLanding from './DemoQueueLanding.svelte';
  import DemoReview from './DemoReview.svelte';

  let screen = 'manage';

  const SCREENS = {
    manage:  { label: 'Manage' },
    project: { label: 'Project' },
    landing: { label: 'Queue' },
    review:  { label: 'Review' },
  };

  function navigate(s) {
    if (s in SCREENS) {
      screen = s;
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="demo-root">
  {#if screen === 'manage'}
    <DemoHome onNavigate={navigate} navVariant="glass" />
  {:else if screen === 'project'}
    <DemoProject onNavigate={navigate} navVariant="glass" />
  {:else if screen === 'landing'}
    <DemoQueueLanding onNavigate={navigate} navVariant="glass" />
  {:else if screen === 'review'}
    <DemoReview onNavigate={navigate} navVariant="glass" />
  {/if}

  <!-- Floating demo-navigation pill -->
  <div class="demo-pill">
    <span class="pill-label">Demo · jump to</span>
    {#each Object.entries(SCREENS) as [key, s]}
      <button
        class="pill-btn"
        class:active={screen === key}
        on:click={() => navigate(key)}
      >{s.label}</button>
    {/each}
  </div>
</div>

<style>
  /* ── Design tokens as CSS custom properties ─────────────────── */
  .demo-root {
    /* Backgrounds */
    --v2-bg:           linear-gradient(180deg, #F7F7F6 0%, #ECECEA 100%);
    --v2-surface:      #F9F9F8;
    --v2-card:         #FFFFFF;

    /* Text */
    --v2-ink:          #15171A;
    --v2-body:         #44464A;
    --v2-mute:         #7F8189;

    /* Borders */
    --v2-line:         #E5E5E2;
    --v2-line-soft:    #EFEFEC;

    /* Nav */
    --v2-nav-ink:      #15171A;
    --v2-nav-mute:     rgba(33,35,40,0.62);

    /* Accent (Media Cloud orange) */
    --v2-accent:       #E25C40;
    --v2-accent-soft:  #FCE5DD;
    --v2-accent-ink:   #B8431F;

    /* Decision palette */
    --v2-kept:         #E25C40;
    --v2-kept-soft:    #FCE5DD;
    --v2-removed:      #1A1C1F;
    --v2-removed-soft: #E1E1DE;
    --v2-added:        #F5A48A;
    --v2-added-soft:   #FDEDE5;
    --v2-skipped:      #9CA0A8;
    --v2-skipped-soft: #E8E8E5;
    --v2-undecided:    #EBEAE5;

    /* Status */
    --v2-red:          #C8362F;
    --v2-red-soft:     #F8DEDB;
    --v2-warn:         #B57A12;
    --v2-warn-soft:    #F6E7C9;
    --v2-neutral:      #E9E9E5;

    /* Typography */
    --v2-sans:         "DM Sans", system-ui, sans-serif;
    --v2-mono:         "DM Mono", ui-monospace, monospace;

    /* Shell */
    min-height: 100vh;
    background: var(--v2-bg);
    font-family: var(--v2-sans);
    position: relative;
  }

  /* Placeholder for screens not yet built */
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-family: var(--v2-sans);
    font-size: 18px;
    color: var(--v2-mute);
  }

  /* ── Floating pill ── */
  .demo-pill {
    position: fixed;
    bottom: 18px;
    right: 18px;
    z-index: 50;
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 5px;
    background: rgba(255,255,255,.72);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 999px;
    box-shadow: 0 12px 30px -16px rgba(0,0,0,.18);
    font-family: var(--v2-sans);
  }

  .pill-label {
    padding: 4px 10px 4px 12px;
    font-size: 11.5px;
    color: var(--v2-mute);
    letter-spacing: .4px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .pill-btn {
    padding: 6px 12px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    background: transparent;
    color: var(--v2-ink);
    font-size: 12.5px;
    font-family: var(--v2-sans);
    font-weight: 500;
    transition: background .15s;
  }
  .pill-btn.active {
    background: var(--v2-accent);
    color: #fff;
    font-weight: 600;
  }
</style>
