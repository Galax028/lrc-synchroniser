<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    lrcData,
    playerDuration,
    playerIsPaused,
    playerProgress,
    playerSource,
  } from "../stores";
  import { formatTimestamp } from "../utils";

  import IconPlayerPauseFilled from "virtual:icons/tabler/player-pause-filled";
  import IconPlayerPlayFilled from "virtual:icons/tabler/player-play-filled";
  import IconRewindBackward5 from "virtual:icons/tabler/rewind-backward-5";
  import IconRewindForward5 from "virtual:icons/tabler/rewind-forward-5";
  import IconVolume from "virtual:icons/tabler/volume";

  import type { LrcMeta } from "../types";

  let playerElement: HTMLAudioElement | undefined;
  let playerVolume: number = 1;
  let seekbarElement: HTMLDivElement | undefined;
  let volumeSliderElement: HTMLDivElement | undefined;

  let title: string | undefined;
  let album: string | undefined;
  let artist: string | undefined;

  $: $lrcData, updateMetadata();
  $: playerElement, $playerProgress, processExternalSeeking();

  onDestroy(() => {
    URL.revokeObjectURL($playerSource);
    playerSource.set("");
    playerDuration.set(NaN);
    playerProgress.set(NaN);
    playerIsPaused.set(true);
  });

  function updateMetadata() {
    if (!$lrcData || !$lrcData.meta) return;

    const titleMeta: LrcMeta | undefined = $lrcData.meta.filter(
      (meta?: LrcMeta) => meta?.key === "ti",
    )[0];
    const albumMeta: LrcMeta | undefined = $lrcData.meta.filter(
      (meta?: LrcMeta) => meta?.key === "al",
    )[0];
    const artistMeta: LrcMeta | undefined = $lrcData.meta.filter(
      (meta?: LrcMeta) => meta?.key === "ar",
    )[0];

    title = titleMeta && titleMeta.value;
    album = albumMeta && albumMeta.value;
    artist = artistMeta && artistMeta.value;
  }

  // Have to process external seeking calls to playerProgress here to fix a bug
  // with Svelte stores in Firefox...
  function processExternalSeeking(): void {
    if (!playerElement || $playerProgress === playerElement.currentTime) return;

    playerElement.currentTime = $playerProgress;
  }

  function onTimeUpdate(event: Event): void {
    playerProgress.set((event.currentTarget as HTMLAudioElement).currentTime);
  }

  function togglePlayback(): void {
    return playerIsPaused.update((isPaused: boolean) => !isPaused);
  }

  function triggerRewind(): void {
    playerProgress.update((progress: number) => progress - 5);
  }

  function triggerFastForward(): void {
    playerProgress.update((progress: number) => progress + 5);
  }

  function onSeekStart(event: PointerEvent): void {
    if (!playerElement || !seekbarElement) return;

    console.log("onSeekStart");
    !$playerIsPaused && playerElement.pause();
    onSeekMove(event);
    window.addEventListener("pointermove", onSeekMove);
    window.addEventListener("pointerup", onSeekStop, { once: true });
  }

  function onSeekMove(event: PointerEvent): void {
    if (!playerElement || !seekbarElement) return;

    console.log("onSeekMove");
    const { left, width }: DOMRect = seekbarElement.getBoundingClientRect();
    playerProgress.set(
      ((event.clientX - left) / width) * playerElement.duration,
    );
  }

  function onSeekStop(): void {
    if (!playerElement) return;

    console.log("onSeekStop");
    window.removeEventListener("pointermove", onSeekMove);
    $playerIsPaused && playerElement.play();
  }

  function onKeydownSeek(event: KeyboardEvent): void {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;

    if (event.key === "ArrowLeft") triggerRewind();
    if (event.key === "ArrowRight") triggerFastForward();
  }

  function onVolumeSliderStart(event: PointerEvent): void {
    if (!volumeSliderElement) return;

    onVolumeSliderMove(event);
    window.addEventListener("pointermove", onVolumeSliderMove);
    window.addEventListener("pointerup", onVolumeSliderStop, { once: true });
  }

  function onVolumeSliderMove(event: PointerEvent): void {
    if (!volumeSliderElement) return;

    const { left, width }: DOMRect =
      volumeSliderElement.getBoundingClientRect();
    let newPlayerVolume: number = (event.clientX - left) / width;
    if (newPlayerVolume < 0) newPlayerVolume = 0;
    if (newPlayerVolume > 1) newPlayerVolume = 1;

    playerVolume = newPlayerVolume;
  }

  function onVolumeSliderStop(): void {
    window.removeEventListener("pointermove", onVolumeSliderMove);
  }

  function onKeydownVolumeSlide(event: KeyboardEvent): void {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;

    let newPlayerVolume: number = playerVolume;
    if (event.key === "ArrowLeft") newPlayerVolume -= 0.05;
    if (event.key === "ArrowRight") newPlayerVolume += 0.05;

    if (newPlayerVolume < 0) newPlayerVolume = 0;
    if (newPlayerVolume > 1) newPlayerVolume = 1;

    playerVolume = newPlayerVolume;
  }
</script>

{#if $playerSource && $lrcData}
  <div
    class="
      flex flex-col justify-center gap-4 rounded-md border-2 border-solid
      border-neutral-800 p-4 md:min-w-[60vh]
    "
  >
    <audio
      bind:this={playerElement}
      src={$playerSource}
      on:timeupdate={onTimeUpdate}
      bind:duration={$playerDuration}
      bind:paused={$playerIsPaused}
      bind:volume={playerVolume}
    />
    <div class="flex select-none items-center justify-center gap-4">
      <span aria-label="Artist Name and Song Title">{artist} - {title}</span>
      <span>/</span>
      <span aria-label="Album Name">{album}</span>
    </div>
    <div class="flex items-center justify-center gap-4">
      <span class="select-none text-sm">{formatTimestamp($playerProgress)}</span
      >
      <div
        class="relative h-1 grow cursor-pointer rounded-full bg-neutral-800"
        style="--progress: {$playerProgress / $playerDuration}%"
        bind:this={seekbarElement}
        on:pointerdown={onSeekStart}
      >
        <div
          class="
            h-full w-[calc(100*var(--progress))] rounded-full bg-blue-600
          "
        />
        <div
          class="
            absolute left-[calc(99*var(--progress))] top-0 h-1 w-1 rounded-full
            bg-blue-600 transition-transform hover:scale-[3]
            focus-visible:scale-[3] focus-visible:outline-none
          "
          aria-label="Audio Seekbar"
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={Math.round(($playerProgress / $playerDuration) * 100)}
          role="slider"
          tabindex="0"
          on:keydown={onKeydownSeek}
        />
      </div>
      <span class="select-none text-sm">{formatTimestamp($playerDuration)}</span
      >
    </div>
    <div
      class="grid grid-cols-[1fr_repeat(3,auto)_1fr] justify-items-center gap-4"
    >
      <button
        class="
          col-start-2 cursor-pointer rounded transition-all
          hover:text-blue-600 focus-visible:text-blue-600
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90
        "
        on:click={triggerRewind}
      >
        <IconRewindBackward5 class="h-8 w-8" />
      </button>
      <button
        class="
          cursor-pointer rounded transition-all
          hover:text-blue-600 focus-visible:text-blue-600
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90
        "
        on:click={togglePlayback}
      >
        {#if $playerIsPaused}
          <IconPlayerPlayFilled class="h-8 w-8" />
        {:else}
          <IconPlayerPauseFilled class="h-8 w-8" />
        {/if}
      </button>
      <button
        class="
          cursor-pointer rounded transition-all
          hover:text-blue-600 focus-visible:text-blue-600
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90
        "
        on:click={triggerFastForward}
      >
        <IconRewindForward5 class="h-8 w-8" />
      </button>
      <div class="ml-auto flex items-center justify-center gap-4">
        <span class="select-none text-sm font-bold"
          >{Math.round(playerVolume * 100)}%</span
        >
        <div
          class="
            relative h-1 min-w-16 grow cursor-pointer rounded-full
            bg-neutral-800
          "
          style="--volume: {playerVolume}%"
          bind:this={volumeSliderElement}
          on:pointerdown={onVolumeSliderStart}
        >
          <div
            class="
              h-full w-[calc(102*var(--volume))] rounded-full
              bg-blue-600
            "
          ></div>
          <div
            class="
              absolute left-[calc(98*var(--volume))] top-0 h-1 w-1 rounded-full
              bg-blue-600 transition-transform hover:scale-[2]
              focus-visible:scale-[2] focus-visible:outline-none
            "
            aria-label="Volume Slider"
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={playerVolume * 100}
            role="slider"
            tabindex="0"
            on:keydown={onKeydownVolumeSlide}
          />
        </div>
        <IconVolume />
      </div>
    </div>
  </div>
{:else}
  <span>Loading Audio Player...</span>
{/if}
