<script>
  // Layout wrapper: provides CSS tokens and fonts for all demo screens.
  // Screen routing is handled by App.svelte; use <slot> to render children.
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
</svelte:head>

<div class="demo-root">
  <slot />
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

</style>
