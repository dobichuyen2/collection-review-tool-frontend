<script>
  import { onMount } from 'svelte';
  import Home from './routes/Home.svelte';
  import DemoShell from './features/collections-review-demo/DemoShell.svelte';
  import DemoIndex from './features/collections-review-demo/DemoIndex.svelte';
  import DemoHome from './features/collections-review-demo/DemoHome.svelte';
  import DemoProject from './features/collections-review-demo/DemoProject.svelte';
  import DemoQueueLanding from './features/collections-review-demo/DemoQueueLanding.svelte';
  import DemoReview from './features/collections-review-demo/DemoReview.svelte';
  import DemoAllProjects from './features/collections-review-demo/DemoAllProjects.svelte';
  import DemoDecisions from './features/collections-review-demo/DemoDecisions.svelte';
  import RootStatic from './routes/RootStatic.svelte';

  const DEMO_ON = import.meta.env.VITE_DEMO_MODE === 'true';
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
  {:else if currentPath === '/demo' && DEMO_ON}
    <DemoShell><DemoIndex onNavigate={navigate} /></DemoShell>
  {:else if currentPath === '/demo/manage' && DEMO_ON}
    <DemoShell><DemoHome onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath === '/demo/projects' && DEMO_ON}
    <DemoShell><DemoAllProjects onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath.match(/^\/demo\/review-projects\/[^/]+\/decisions$/) && DEMO_ON}
    <DemoShell><DemoDecisions onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath.match(/^\/demo\/review-projects\/[^/]+\/queues\/[^/]+\/decisions$/) && DEMO_ON}
    <DemoShell><DemoDecisions onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath.match(/^\/demo\/review-projects\/[^/]+$/) && DEMO_ON}
    <DemoShell><DemoProject onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath.match(/^\/demo\/review-projects\/[^/]+\/queues\/[^/]+$/) && DEMO_ON}
    <DemoShell><DemoQueueLanding onNavigate={navigate} navVariant="glass" /></DemoShell>
  {:else if currentPath.match(/^\/demo\/reviews\/[^/]+$/) && DEMO_ON}
    <DemoShell><DemoReview onNavigate={navigate} navVariant="glass" /></DemoShell>
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
