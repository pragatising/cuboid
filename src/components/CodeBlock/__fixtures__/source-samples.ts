/** Sample JavaScript for CodeBlock stories. */
export const sampleJavaScript = `import { fetchUser } from "./api";

export async function loadProfile(userId) {
  // Fetch the latest profile from the API
  const response = await fetchUser(userId);

  if (!response.ok) {
    throw new Error(\`Failed to load \${userId}\`);
  }

  return {
    id: response.id,
    name: response.name,
    active: true,
  };
}
`;

/** Sample TypeScript for CodeBlock stories. */
export const sampleTypeScript = `export interface UserProfile {
  id: string;
  name: string;
  role: "admin" | "member";
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  const rows = await db.query<UserProfile>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}
`;

/** Sample HTML for CodeBlock stories. */
export const sampleHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Cube Docs</title>
    <link rel="stylesheet" href="/theme.css" />
  </head>
  <body>
    <main class="docs">
      <h1>Welcome</h1>
      <p>Install with <code>npm install @sragatiping/cuboid</code>.</p>
    </main>
  </body>
</html>
`;

/** Sample CSS for CodeBlock stories. */
export const sampleCss = `.docs {
  max-width: 48rem;
  margin-inline: auto;
  padding: var(--cube-stack-gap-lg);
}

.docs h1 {
  color: var(--cube-colors-functional-foreground-default);
  font-size: 1.5rem;
}

.docs code {
  font-family: var(--cube-typography-text-inline-code-fontFamily);
  background: var(--cube-colors-functional-background-neutral-muted);
}
`;

/** Long sample for virtual-scroll demo. */
export function buildLongJavaScript(lineCount = 200): string {
  const lines = [
    "/** Generated module — virtual scroll stress test */",
    "export const records = [",
  ];

  for (let i = 0; i < lineCount; i++) {
    lines.push(`  { id: ${i}, label: "row_${i}", enabled: ${i % 2 === 0} },`);
  }

  lines.push("];");
  return lines.join("\n");
}
