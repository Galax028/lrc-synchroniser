<script lang="ts">
  import { lrcFile } from "./stores";

  import AudioPlayer from "./components/AudioPlayer.svelte";
  import FileSelector from "./components/FileSelector.svelte";
  import LRCDisplay from "./components/LRCDisplay.svelte";

  let isReady: boolean;
</script>

<main class="text-neutral-50">
  {#if !isReady}
    <FileSelector bind:isReady />
  {:else if isReady && $lrcFile}
    <div
      class="
        flex max-h-[90svh] max-w-3xl flex-col gap-4 rounded-md border-2
        border-solid border-neutral-800 p-4 shadow-md
      "
    >
      <LRCDisplay />
      <AudioPlayer />
    </div>
  {/if}
  <footer class="mt-2 grid select-none justify-items-center">
    <span class="text-xs text-neutral-400"
      >LRC Synchroniser v1.0.0 •
      <a
        class="
          text-neutral-500 underline transition-colors hover:text-neutral-400
          focus-visible:text-neutral-400 focus-visible:outline-none
        "
        href="//github.com/Galax028/lrc-synchroniser"
        target="_blank"
      >
        GitHub
      </a>
    </span>
  </footer>
</main>
