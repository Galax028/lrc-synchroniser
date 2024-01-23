<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { lrcData, lrcFile, lrcFileWriter, playerProgress } from "../stores";
  import { formatTimestamp } from "../utils";

  import IconArrowNarrowRight from "virtual:icons/tabler/arrow-narrow-right";
  import IconLoader3 from "virtual:icons/tabler/loader-3";
  import IconMinus from "virtual:icons/tabler/minus";

  import type { LrcLine, LrcMeta, LrcObject } from "../types";

  let rootElement: HTMLDivElement | undefined;

  // Parses the LRC file from lrcFile store into the lrcData store.
  onMount(() => {
    if (!$lrcFile || $lrcData) return;

    const lrcReader = new FileReader();
    lrcReader.addEventListener("load", (event: ProgressEvent<FileReader>) => {
      let metaIndex: number = 0;
      let lyricsIndex: number = 0;
      const lrcDataString = event.target?.result as string;

      const parsedLrcData: (LrcObject | undefined)[] = lrcDataString
        .split("\n")
        .filter((line: string) => line != "")
        .map((line: string) => {
          const bracketed: string = [...line.matchAll(/\[(.*?)\]/g)].map(
            (ma: RegExpMatchArray) => ma[1],
          )[0];

          if (bracketed.match(/\d{2}:\d{2}.\d{1,3}/y) === null) {
            const bracketedValues: string[] = bracketed
              .split(/:(.*)/)
              .map((item: string) => item.trim());
            metaIndex++;

            return {
              index: metaIndex - 1,
              key: bracketedValues[0],
              value: bracketedValues.slice(1).join(""),
            } as LrcMeta;
          }

          let timestamp: number = 0;
          const [min, sec, ms]: number[] = bracketed
            .split(/[:.]/)
            .map((item: string) => Number(item));
          timestamp += min * 60;
          timestamp += sec;
          timestamp += ms / 1000;

          const lyrics = line.split("]").slice(1).join("").trim();
          if (!lyrics) return undefined;

          lyricsIndex++;

          return {
            index: lyricsIndex - 1,
            timestamp: timestamp,
            lyrics: lyrics,
          } as LrcLine;
        })
        .filter((line?: LrcObject) => line !== undefined);

      lrcData.set({
        meta: parsedLrcData.slice(0, metaIndex) as LrcMeta[],
        lines: parsedLrcData.slice(metaIndex) as LrcLine[],
        currentLine: 0,
      });
    });

    lrcReader.readAsText($lrcFile);
  });

  // Synchronises (if not already synchronised) lyrics every time the
  // playerProgress store is updated.
  $: $playerProgress, synchroniseLyrics();

  onDestroy(() => {
    lrcFileWriter.set(undefined);
    lrcData.set(undefined);
  });

  function synchroniseLyrics(): void {
    if (!$playerProgress || !$lrcData) return;

    const currentLineObject: LrcLine = binarySearchLrcLines($playerProgress);
    if ($lrcData.currentLine === currentLineObject.index) return;
    $lrcData.currentLine = currentLineObject.index;

    const currentLineElement: HTMLDivElement = document.querySelector(
      `#lyrics-${$lrcData.lines[$lrcData.currentLine].index}`,
    )! as HTMLDivElement;
    if (!currentLineElement.nextElementSibling) return scrollToBottom();

    currentLineElement.nextElementSibling.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }

  // Modified binary search algorithm to search for the nearest timestamp.
  function binarySearchLrcLines(timestamp: number): LrcLine {
    if (!$lrcData) throw Error("lrcData has not been populated.");

    let start: number = 0;
    let end: number = $lrcData.lines.length - 1;

    while (start <= end) {
      const middle: number = start + Math.floor((end - start) / 2);

      if ($lrcData.lines[middle].timestamp === timestamp)
        return $lrcData.lines[middle];
      if ($lrcData.lines[middle].timestamp < timestamp) start = middle + 1;
      else end = middle - 1;
    }

    if (!$lrcData.lines[end]) return $lrcData.lines[start];
    if (!$lrcData.lines[start]) return $lrcData.lines[end];
    if (
      timestamp > $lrcData.lines[end].timestamp &&
      $lrcData.lines[start].timestamp > timestamp
    )
      return $lrcData.lines[end];

    throw Error("Timestamp binary search failed");
  }

  // Synchronises the line of lyrics that the user wanted to seek to.
  function synchroniseLyricsOnClick(event: MouseEvent | KeyboardEvent): void {
    if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key))
      return;

    const lyricsLineElement = (event.currentTarget as HTMLSpanElement)
      .parentElement as HTMLDivElement;
    playerProgress.set(
      Number(lyricsLineElement.getAttribute("data-timestamp")),
    );
  }

  // Synchronise to bottom of lyrics container. Only used when the lyrics
  // synchronisation is at the last line.
  export function scrollToBottom(): void {
    if (!rootElement) return;

    return rootElement.scrollTo({
      top: rootElement.scrollHeight,
      behavior: "smooth",
    });
  }
</script>

<div
  class="
    h-[80svh] overflow-y-auto scroll-smooth rounded-md border-2 border-solid
    border-neutral-800 p-4 focus-visible:outline-none md:min-w-[60vh]
  "
  bind:this={rootElement}
>
  {#if $lrcData}
    {#each $lrcData.lines as lrcLine (lrcLine.index)}
      <div
        class="
        flex items-center justify-center gap-2 text-neutral-600
        hover:text-blue-400 has-[:focus-visible]:text-blue-400
        data-[current=true]:text-blue-600
      "
        id="lyrics-{lrcLine.index}"
        data-current={lrcLine.index === $lrcData.currentLine}
        data-timestamp={lrcLine.timestamp}
      >
        {#if lrcLine.index === $lrcData.currentLine}
          <IconArrowNarrowRight
            class="w-4 flex-shrink-0 transition-colors duration-300"
          />
        {:else}
          <IconMinus class="w-4 flex-shrink-0 transition-colors duration-300" />
        {/if}
        <span
          class="
          cursor-pointer select-none text-xl font-bold transition-colors
          duration-300 focus-visible:outline-none
        "
          role="button"
          tabindex="0"
          on:click={synchroniseLyricsOnClick}
          on:keydown={synchroniseLyricsOnClick}
        >
          {lrcLine.lyrics}
        </span>
        <span
          class="
          grow select-none pl-4 text-right text-xs font-bold text-neutral-600
          transition-colors duration-300 md:pl-24
        "
        >
          {formatTimestamp(lrcLine.timestamp)}</span
        >
      </div>
    {/each}
  {:else}
    <div class="flex h-full flex-col items-center justify-center">
      <IconLoader3 class="h-32 w-32 animate-spin" />
      <span class="text-center text-2xl font-bold">Loading Lyrics</span>
    </div>
  {/if}
</div>
