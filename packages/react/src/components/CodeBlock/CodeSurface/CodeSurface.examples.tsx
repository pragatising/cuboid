import { CodeSurface, buildLines, highlightSource } from "@sragatiping/cuboid";

export function Default() {
  const lines = highlightSource(`const total = items.length;\nconsole.log(total);`, "javascript");
  return <CodeSurface lines={lines} gutterLineCount={lines.length} />;
}

export function FromJson() {
  const lines = buildLines({ name: "cuboid", private: true, tags: ["ui", "tokens"] }, new Set());
  return <CodeSurface lines={lines} gutterLineCount={lines.length} />;
}

export function Embedded() {
  const lines = highlightSource(`GET /orders/1042\nAccept: application/json`, "text");
  return <CodeSurface lines={lines} gutterLineCount={lines.length} surfaceVariant="embedded" />;
}

export function WatchedLines() {
  const lines = highlightSource(`const a = 1;\nconst b = 2;\nconst c = a + b;`, "javascript");
  return <CodeSurface lines={lines} gutterLineCount={lines.length} defaultWatchlist={[2]} onWatchlistChange={() => {}} />;
}
