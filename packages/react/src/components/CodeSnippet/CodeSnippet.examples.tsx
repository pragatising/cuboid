import { CodeSnippet } from "@sragatiping/cuboid";

const data = {
  name: "cuboid",
  private: true,
  tags: ["ui", "tokens"],
  repository: { type: "git", url: "https://example.com/cuboid.git" },
};

export function Default() {
  return <CodeSnippet data={data} />;
}

export function Collapsed() {
  return <CodeSnippet data={data} defaultCollapsed />;
}

export function Embedded() {
  return <CodeSnippet data={data} surfaceVariant="embedded" />;
}

export function WithoutLinks() {
  return <CodeSnippet data={data} linkify={false} />;
}

export function WatchedLines() {
  return <CodeSnippet data={data} defaultWatchlist={[2]} onWatchlistChange={() => {}} />;
}
