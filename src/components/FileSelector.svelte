<script lang="ts">
  import { audioFile, playerSource, lrcFileWriter, lrcFile } from "../stores";

  export let isReady: boolean = false;

  let audioFileList: FileList | undefined;
  let lrcFileList: FileList | undefined;

  let showAudioFileError: boolean = false;
  let showLrcFileError: boolean = false;

  $: isReady, audioFileList, onAudioFileUpdate();
  $: isReady, lrcFileList, onLrcFileUpdate();

  function onAudioFileUpdate() {
    if (isReady || !audioFileList) return;

    $audioFile = audioFileList.item(0)!;
    if (showAudioFileError) showAudioFileError = false;
  }

  function onLrcFileUpdate() {
    if (isReady || !lrcFileList) return;

    lrcFileWriter.set(lrcFileList.item(0)!);
    if (showLrcFileError) showLrcFileError = false;
  }

  function checkReadiness(): void {
    if (!$audioFile) showAudioFileError = true;
    if (!$lrcFile) showLrcFileError = true;
    if (!$audioFile || !$lrcFile) return;

    playerSource.set(URL.createObjectURL($audioFile));
    isReady = true;
  }
</script>

<div
  class="
    flex flex-col gap-4 rounded-md border-2 border-solid border-neutral-800 p-4
    shadow-md
  "
>
  <h1 class="select-none text-center text-lg font-bold">LRC Synchroniser</h1>
  <hr class="h-px border-none bg-neutral-600" />
  <div class="flex select-none flex-col gap-1">
    <p>Select an Audio File:</p>
    <label
      class="
        cursor-pointer select-none rounded bg-neutral-800 p-2 text-center
        font-bold focus-visible:outline-none has-[:focus-visible]:ring-2
        has-[:focus-visible]:ring-offset-2
        has-[:focus-visible]:ring-offset-neutral-900
      "
      for="audio"
    >
      {$audioFile ? $audioFile.name : "Browse"}
      <input
        bind:files={audioFileList}
        class="absolute z-[-1] h-0 w-0 overflow-hidden opacity-0"
        accept="audio/*"
        name="audio"
        id="audio"
        type="file"
      />
    </label>
    {#if showAudioFileError}
      <p class="select-none text-sm text-red-700">An audio file is required.</p>
    {/if}
  </div>
  <div class="flex select-none flex-col gap-1">
    <p>Select a Lyrics File (.lrc):</p>
    <label
      class="
        cursor-pointer select-none rounded bg-neutral-800 p-2 text-center
        font-bold focus-visible:outline-none has-[:focus-visible]:ring-2
        has-[:focus-visible]:ring-offset-2
        has-[:focus-visible]:ring-offset-neutral-900
      "
      for="lrc"
    >
      {$lrcFile ? $lrcFile.name : "Browse"}
      <input
        bind:files={lrcFileList}
        class="absolute z-[-1] h-0 w-0 overflow-hidden opacity-0"
        accept=".lrc"
        name="lrc"
        id="lrc"
        type="file"
      />
    </label>
    {#if showLrcFileError}
      <p class="select-none text-sm text-red-700">A lyrics file is required.</p>
    {/if}
  </div>
  <hr class="h-px border-none bg-neutral-600" />
  <button
    class="
      rounded bg-neutral-800 p-1 text-lg font-bold focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-offset-2
      focus-visible:ring-offset-neutral-900
    "
    on:click={checkReadiness}
  >
    Go!
  </button>
</div>
