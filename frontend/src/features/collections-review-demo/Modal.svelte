<script>
  import { createEventDispatcher } from 'svelte';
  export let show = false;
  export let title = '';

  const dispatch = createEventDispatcher();
  function close() { dispatch('close'); }
  function onKey(e) { if (show && e.key === 'Escape') close(); }
  function onOverlay(e) { if (e.target === e.currentTarget) close(); }
</script>

<svelte:window on:keydown={onKey} />

{#if show}
  <div class="overlay" on:click={onOverlay} role="presentation">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-title">{title}</span>
        <button class="close-btn" on:click={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.42);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
    padding: 24px;
    backdrop-filter: blur(3px);
    animation: fade-in .15s ease;
  }
  @keyframes fade-in { from { opacity: 0; } }

  .modal {
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 80px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.08);
    min-width: 480px;
    max-width: 640px;
    width: 100%;
    max-height: 82vh;
    overflow-y: auto;
    animation: slide-up .18s ease;
    font-family: var(--v2-sans, 'DM Sans', sans-serif);
  }
  @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } }

  .modal-header {
    padding: 20px 24px 18px;
    border-bottom: 1px solid #efefef;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: #fff;
    border-radius: 18px 18px 0 0;
    z-index: 1;
  }
  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--v2-ink, #1A1C1F);
  }
  .close-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    background: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
    color: #999;
    flex-shrink: 0;
    transition: background .12s, color .12s;
  }
  .close-btn:hover { background: #f5f5f5; color: #333; }
</style>
