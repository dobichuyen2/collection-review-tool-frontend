<script>
  import Modal from './Modal.svelte';
  export let show = false;
  export let role = 'admin'; // 'admin' | 'reviewer'
</script>

<Modal {show} title="How it works" on:close>
  <div class="body">
    {#if role === 'admin'}
      <section>
        <h3>General Admin overview</h3>
        <p>As a general admin, you create and manage review projects that organise the curation of Media Cloud's source collections.</p>
        <ol>
          <li><b>Create a project</b> — group one or more seed collections into a review project.</li>
          <li><b>Define queues</b> — break the project into reviewer queues, each assigned to a person or team.</li>
          <li><b>Share queue links</b> — reviewers get a tokenised URL; no account is needed.</li>
          <li><b>Monitor progress</b> — watch decisions roll up in real time on the Project Admin screen.</li>
          <li><b>Export &amp; publish</b> — when review is complete, export the final CSV and publish the updated collection back to Media Cloud.</li>
        </ol>
      </section>
      <section>
        <h3>Quick review</h3>
        <p>Use the Collection ID card on this page to start a standalone review of a single collection without setting up a full project.</p>
      </section>
    {:else}
      <section>
        <h3>Reviewing sources</h3>
        <p>You'll see one source at a time. For each source, decide:</p>
        <ul>
          <li><b class="kept">Keep</b> — the source belongs in this collection.</li>
          <li><b class="removed">Remove</b> — the source should not be included.</li>
          <li><b class="skipped">Skip</b> — you're unsure; leave it for the lead reviewer.</li>
        </ul>
      </section>
      <section>
        <h3>Keyboard shortcuts</h3>
        <div class="shortcuts">
          <div><kbd>K</kbd> or <kbd>↵</kbd> — Keep</div>
          <div><kbd>R</kbd> — Remove</div>
          <div><kbd>S</kbd> — Skip</div>
        </div>
      </section>
      <section>
        <h3>Adding sources</h3>
        <p>If you know of a source that should be included but isn't in the queue, use <b>Propose new source</b> to suggest it for the lead reviewer to approve.</p>
      </section>
    {/if}
  </div>
</Modal>

<style>
  .body { padding: 22px 24px 28px; font-family: var(--v2-sans, 'DM Sans', sans-serif); }
  section { margin-bottom: 24px; }
  section:last-child { margin-bottom: 0; }
  h3 {
    font-size: 12px; font-weight: 600; color: var(--v2-mute, #9CA0A8);
    text-transform: uppercase; letter-spacing: .6px; margin: 0 0 10px;
  }
  p { font-size: 15px; color: var(--v2-body, #5A5E66); line-height: 1.65; margin: 0 0 8px; }
  ol, ul { margin: 6px 0 0; padding-left: 20px; font-size: 15px; color: var(--v2-body, #5A5E66); line-height: 1.75; }
  .shortcuts { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .shortcuts > div { font-size: 15px; color: var(--v2-body, #5A5E66); display: flex; align-items: center; gap: 8px; }
  kbd {
    display: inline-block; padding: 2px 7px;
    border-radius: 5px; border: 1px solid #ddd; background: #f6f6f6;
    font-size: 13px; font-family: var(--v2-mono, 'DM Mono', monospace);
  }
  .kept    { color: #E25C40; }
  .removed { color: #1A1C1F; }
  .skipped { color: #9CA0A8; }
</style>
