<script>
  /** totals: { reviewed, kept, removed, added, skipped, undecided } */
  export let totals;
  export let height = 12;
  export let withLegend = false;
  export let highlight = null;

  const SEGS = [
    { k: 'kept',    label: 'Kept',      varColor: 'var(--v2-kept)'    },
    { k: 'removed', label: 'Removed',   varColor: 'var(--v2-removed)' },
    { k: 'added',   label: 'Added',     varColor: 'var(--v2-added)'   },
    { k: 'skipped', label: 'Skipped',   varColor: 'var(--v2-skipped)' },
  ];
  const LEGEND = [
    { k: 'kept',      label: 'Kept',      varColor: 'var(--v2-kept)'     },
    { k: 'removed',   label: 'Removed',   varColor: 'var(--v2-removed)'  },
    { k: 'added',     label: 'Added',     varColor: 'var(--v2-added)'    },
    { k: 'skipped',   label: 'Skipped',   varColor: 'var(--v2-skipped)'  },
    { k: 'undecided', label: 'Undecided', varColor: 'var(--v2-undecided)', mute: true },
  ];

  $: total = ((totals.reviewed ?? 0) + (totals.undecided ?? 0)) || 1;
</script>

<div class="decision-bar">
  <div class="bar-track" style:height="{height}px">
    {#each SEGS as s}
      {@const pct = ((totals[s.k] ?? 0) / total) * 100}
      <div
        class="bar-seg"
        title="{s.k} · {totals[s.k] ?? 0}"
        style:width="{pct}%"
        style:background={s.varColor}
        style:opacity={highlight ? (highlight === s.k ? 1 : 0.2) : 1}
      ></div>
    {/each}
  </div>

  {#if withLegend}
    <div class="legend">
      {#each LEGEND as s}
        <span class="legend-item" class:muted={s.mute}>
          <span class="legend-swatch" class:swatch-outline={s.mute} style:background={s.varColor}></span>
          {s.label}
          <b class="legend-val" class:muted={s.mute}>{(totals[s.k] ?? 0).toLocaleString()}</b>
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .decision-bar { width: 100%; }

  .bar-track {
    border-radius: 999px;
    background: var(--v2-undecided);
    overflow: hidden;
    display: flex;
  }

  .bar-seg {
    height: 100%;
    transition: opacity .28s ease;
    flex-shrink: 0;
  }

  .legend {
    display: flex;
    gap: 22px;
    margin-top: 10px;
    font-size: 13.5px;
    color: var(--v2-body);
    flex-wrap: wrap;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  .legend-item.muted { color: var(--v2-mute); }

  .legend-swatch {
    width: 9px;
    height: 9px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .legend-swatch.swatch-outline {
    border: 1px solid var(--v2-line);
  }

  .legend-val {
    font-weight: 600;
    font-family: var(--v2-mono);
    margin-left: 1px;
    color: var(--v2-ink);
  }
  .legend-val.muted { color: var(--v2-mute); }
</style>
