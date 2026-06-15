<script>
  import { onMount } from 'svelte';
  import Home from './routes/Home.svelte';
  import DemoShell from './features/collections-review-demo/DemoShell.svelte';
  import RootStatic from './routes/RootStatic.svelte';
  import Review from './routes/Review.svelte';
  import ReviewProject from './routes/ReviewProject.svelte';
import ReviewSkippedQueue from './routes/ReviewSkippedQueue.svelte';
import ReviewAddedQueue from './routes/ReviewAddedQueue.svelte';
import ReviewRemovedQueue from './routes/ReviewRemovedQueue.svelte';
import ReviewKeptQueue from './routes/ReviewKeptQueue.svelte';
import ReviewProjectQueueLanding from './routes/ReviewProjectQueueLanding.svelte';

  let currentPath = window.location.pathname;

  // Simple router using browser history API
  function navigate(path) {
    window.history.pushState({}, '', path);
    currentPath = path;
  }

  onMount(() => {
    // Listen for browser back/forward buttons
    window.addEventListener('popstate', () => {
      currentPath = window.location.pathname;
    });

    // Export navigate function for use in components
    window.navigate = navigate;
  });
</script>

<main>
  {#if currentPath === '/'}
    <RootStatic />
  {:else if currentPath.startsWith('/demo')}
    <DemoShell />
  {:else if currentPath === '/manage' || currentPath === '/manage/'}
    <Home />
  {:else if currentPath.match(/^\/review-projects\/[0-9a-fA-F-]+\/skipped$/)}
    <ReviewSkippedQueue />
  {:else if currentPath.match(/^\/review-projects\/[0-9a-fA-F-]+\/added$/)}
    <ReviewAddedQueue />
  {:else if currentPath.match(/^\/review-projects\/[0-9a-fA-F-]+\/removed$/)}
    <ReviewRemovedQueue />
  {:else if currentPath.match(/^\/review-projects\/[0-9a-fA-F-]+\/kept$/)}
    <ReviewKeptQueue />
  {:else if currentPath.match(/^\/review-projects\/[0-9a-fA-F-]+\/queues\/[0-9a-fA-F-]+$/)}
    <ReviewProjectQueueLanding />
  {:else if currentPath.startsWith('/review-projects/')}
    <ReviewProject />
  {:else if currentPath.startsWith('/reviews/')}
    <Review />
  {:else}
    <RootStatic />
  {/if}
</main>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
  }

  main {
    min-height: 100vh;
  }
</style>
