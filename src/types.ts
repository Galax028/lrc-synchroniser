export interface LrcMeta {
  index: number;
  key: "ti" | "ar" | "al" | "length";
  value: string;
}

export interface LrcLine {
  index: number;
  timestamp: number;
  lyrics: string;
}

export type LrcObject = LrcMeta | LrcLine;

export interface LrcStore {
  meta: (LrcMeta | undefined)[];
  lines: LrcLine[];
  currentLine: number;
}
