import { readonly, writable } from "svelte/store";

import type { LrcStore } from "./types";

export const audioFile = writable<File | undefined>(undefined);
export const lrcFileWriter = writable<File | undefined>(undefined);
export const lrcFile = readonly<File | undefined>(lrcFileWriter);

export const lrcData = writable<LrcStore | undefined>(undefined);

export const playerSource = writable<string>("");
export const playerDuration = writable<number>(NaN);
export const playerProgress = writable<number>(0);
export const playerIsPaused = writable<boolean>(true);
