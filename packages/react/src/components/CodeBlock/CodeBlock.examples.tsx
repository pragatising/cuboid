import { CodeBlock } from "@sragatiping/cuboid";

const code = `export async function loadProfile(userId) {
  // Fetch the latest profile from the API
  const response = await fetchUser(userId);

  if (!response.ok) {
    throw new Error(\`Failed to load \${userId}\`);
  }

  return { id: response.id, name: response.name, active: true };
}
`;

export function Default() {
  return <CodeBlock code={code} language="javascript" />;
}

export function Html() {
  return <CodeBlock code={`<button class="primary" disabled>\n  Save changes\n</button>`} language="html" />;
}

export function Css() {
  return <CodeBlock code={`.card {\n  padding: 16px;\n  border-radius: 8px;\n  color: #1f2328;\n}`} language="css" />;
}

export function PlainText() {
  return <CodeBlock code={"Tracking id: 8f2a-91c4\nSee https://example.com/docs or write to help@example.com"} linkify />;
}

export function ScrollsWhenTall() {
  return <CodeBlock code={Array.from({ length: 40 }, (_, line) => `const value${line} = ${line};`).join("\n")} language="javascript" maxHeight="200px" />;
}
