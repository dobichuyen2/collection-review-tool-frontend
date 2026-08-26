<script>
  export let onNavigate = () => {};

  const ROLES = [
    {
      label: 'Project Manager',
      desc: 'Creates projects, generates reviewer queues, monitors progress, exports results.',
      screens: [
        { title: 'General Admin',  sub: 'Manage all projects + quick-start a single review', path: '/demo/manage' },
        { title: 'Project Admin',  sub: 'Climate Reporting · US East Coast',                 path: '/demo/review-projects/proj_8fa221' },
      ],
    },
    {
      label: 'Reviewer',
      desc: 'Receives a queue link, decides Keep / Remove / Skip on each source, proposes new ones.',
      screens: [
        { title: 'Queue Landing',  sub: 'Invitation + your queue overview',                  path: '/demo/review-projects/proj_8fa221/queues/q1' },
        { title: 'Review screen',  sub: 'One source at a time — decide and advance',         path: '/demo/reviews/124' },
      ],
    },
  ];
</script>

<div class="index-page">
  <div class="index-wrap">
    <div class="index-header">
      <div class="eyebrow">V2 redesign · demo</div>
      <h1 class="index-h1">Collections Review Portal</h1>
      <p class="index-sub">
        Prototype running on mock data — no backend required.
        Choose a role below to enter the interface.
      </p>
    </div>

    <div class="roles-grid">
      {#each ROLES as role}
        <div class="role-block">
          <div class="role-header">
            <div class="role-label">{role.label}</div>
            <p class="role-desc">{role.desc}</p>
          </div>
          <div class="screens-list">
            {#each role.screens as s}
              <button class="screen-card" on:click={() => onNavigate(s.path)}>
                <div class="screen-card-left">
                  <div class="screen-title">{s.title}</div>
                  <div class="screen-sub">{s.sub}</div>
                </div>
                <svg class="screen-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="index-footer">
      <span class="footer-note">
        All data is mocked. See
        <code>BACKEND-GAPS.md</code>
        for what needs backend work before production.
      </span>
    </div>
  </div>
</div>

<style>
  .index-page {
    min-height: 100vh;
    width: 100%;
    background: var(--v2-bg);
    font-family: var(--v2-sans);
    color: var(--v2-ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    box-sizing: border-box;
  }

  /* Explicit max-width wrapper — reliable centering independent of flex ancestor chain */
  .index-wrap {
    width: 100%;
    max-width: 960px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .index-header {
    text-align: center;
    max-width: 560px;
    margin-bottom: 52px;
  }
  .eyebrow {
    font-size: 13px;
    font-family: var(--v2-mono);
    color: var(--v2-mute);
    text-transform: uppercase;
    letter-spacing: .8px;
    margin-bottom: 14px;
  }
  .index-h1 {
    font-size: 48px;
    font-weight: 600;
    letter-spacing: -1.6px;
    line-height: 1.04;
    margin: 0 0 16px;
    color: var(--v2-ink);
  }
  .index-sub {
    font-size: 16px;
    color: var(--v2-body);
    line-height: 1.55;
    margin: 0;
  }

  .roles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
    width: 100%;
  }

  @media (max-width: 620px) {
    .index-page { padding: 60px 24px; }
    .roles-grid { grid-template-columns: 1fr; }
  }

  .role-block {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .role-header { padding: 0 4px; }
  .role-label {
    font-size: 11px;
    font-family: var(--v2-mono);
    text-transform: uppercase;
    letter-spacing: .8px;
    color: var(--v2-accent);
    font-weight: 500;
    margin-bottom: 6px;
  }
  .role-desc {
    font-size: 13.5px;
    color: var(--v2-mute);
    line-height: 1.5;
    margin: 0;
  }

  .screens-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .screen-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    background: var(--v2-card);
    border: 1px solid var(--v2-line);
    border-radius: 14px;
    cursor: pointer;
    font-family: var(--v2-sans);
    text-align: left;
    width: 100%;
    transition: border-color .18s, box-shadow .18s;
    box-shadow: 0 1px 0 rgba(0,0,0,.02);
  }
  .screen-card:hover {
    border-color: var(--v2-accent);
    box-shadow: 0 0 0 3px var(--v2-accent-soft);
  }

  .screen-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--v2-ink);
  }
  .screen-sub {
    font-size: 13.5px;
    color: var(--v2-mute);
    margin-top: 3px;
  }
  .screen-arrow { color: var(--v2-mute); flex-shrink: 0; }
  .screen-card:hover .screen-arrow { color: var(--v2-accent); }

  .index-footer {
    margin-top: 44px;
    text-align: center;
    width: 100%;
  }
  .footer-note {
    font-size: 13px;
    color: var(--v2-mute);
  }
  .footer-note code {
    font-family: var(--v2-mono);
    background: var(--v2-neutral);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
</style>
