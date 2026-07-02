import React from "react";

export type CodeViewingDocsFocus = "overview" | "codeBlock" | "jsonCodeView" | "apiResponseViewer";

const FOCUS_SUBTITLE: Record<CodeViewingDocsFocus, React.ReactNode> = {
  overview:
    "Three public components for showing code and data — each owns a different job. All render through the internal CodeSurface primitive.",
  codeBlock:
    "Generic source display — pass a string and a language (JavaScript, HTML, CSS, …). For parsed JSON objects use JsonCodeView instead.",
  jsonCodeView:
    "JSON data viewer — pass a parsed object, not a string. Collapse by path, linkify string values, watchlist lines. Composed inside ApiResponseViewer for HTTP bodies.",
  apiResponseViewer:
    "HTTP response shell — status, method, URL, headers, timing, plus the body via JsonCodeView. Use when you have a full network response, not just JSON.",
};

export function CodeViewingDocsSubtitle({ focus }: { focus: CodeViewingDocsFocus }) {
  return <>{FOCUS_SUBTITLE[focus]}</>;
}

export function CodeViewingArchitectureSection({
  focus = "overview",
}: {
  focus?: CodeViewingDocsFocus;
}) {
  return (
    <div className="cube-docs-sections">
      <div className="cube-docs-section cube-docs-section--wide">
        <h3 className="cube-docs-section__title">Layering</h3>
        <pre
          className="cube-docs-architecture-diagram"
          style={{
            margin: 0,
            padding: "var(--cube-stack-gap-sm)",
            fontFamily: "var(--cube-typography-fontFamily-mono)",
            fontSize: "var(--cube-typography-text-body-xs-fontSize)",
            lineHeight: 1.5,
            borderRadius: "var(--cube-sizes-borderRadius-md)",
            border: "var(--cube-sizes-borderWidth-thin) solid var(--cube-color-border-gray-2)",
            background: "var(--cube-color-bg-gray-light-2)",
            overflowX: "auto",
          }}
        >
          {`CodeSurface          internal — gutter, tokens, scroll, virtual window
    │
    ├── CodeBlock           code: string + language (JS, HTML, CSS…)
    │
    ├── JsonCodeView        data: unknown (parsed JSON)
    │
    └── ApiResponseViewer   status + headers + url + body
              └── JsonCodeView for body only`}
        </pre>
        <p className="cube-docs-note" style={{ marginTop: "var(--cube-stack-gap-sm)" }}>
          You do not choose between <code>JsonCodeView</code> and{" "}
          <code>ApiResponseViewer</code> — the shell wraps the JSON viewer. The meaningful
          split is <code>CodeBlock</code> (text) vs <code>JsonCodeView</code> (data).
        </p>
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h3 className="cube-docs-section__title">When to use which</h3>
        <table className="cube-docs-table sbdocs-table">
          <thead>
            <tr>
              <th>Situation</th>
              <th>Component</th>
            </tr>
          </thead>
          <tbody>
            <tr className={focus === "codeBlock" ? "cube-docs-table-row--focus" : undefined}>
              <td>Docs sample, curl, React/HTML/CSS source</td>
              <td>
                <code>CodeBlock</code>
              </td>
            </tr>
            <tr className={focus === "jsonCodeView" ? "cube-docs-table-row--focus" : undefined}>
              <td>Debug panel, state dump, config object (no HTTP chrome)</td>
              <td>
                <code>JsonCodeView</code>
              </td>
            </tr>
            <tr
              className={
                focus === "apiResponseViewer" ? "cube-docs-table-row--focus" : undefined
              }
            >
              <td>Network tab — status, headers, and JSON body</td>
              <td>
                <code>ApiResponseViewer</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cube-docs-section cube-docs-section--wide">
        <h3 className="cube-docs-section__title">CodeBlock vs JsonCodeView</h3>
        <table className="cube-docs-table sbdocs-table">
          <thead>
            <tr>
              <th></th>
              <th>
                <code>CodeBlock</code>
              </th>
              <th>
                <code>JsonCodeView</code>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Input</td>
              <td>
                <code>code: string</code>
              </td>
              <td>
                <code>data: unknown</code>
              </td>
            </tr>
            <tr>
              <td>Tokenizer</td>
              <td>Language grammar on text</td>
              <td>
                <code>buildLines()</code> on parsed data
              </td>
            </tr>
            <tr>
              <td>Collapse by JSON path</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Linkify URLs in strings</td>
              <td>Optional (off by default)</td>
              <td>Yes (on by default)</td>
            </tr>
            <tr>
              <td>HTTP metadata</td>
              <td>No</td>
              <td>No — use <code>ApiResponseViewer</code></td>
            </tr>
          </tbody>
        </table>
        <p className="cube-docs-note" style={{ marginTop: "var(--cube-stack-gap-sm)" }}>
          Avoid <code>CodeBlock language=&quot;json&quot;</code> with{" "}
          <code>JSON.stringify(body)</code> for API payloads — you lose path-based collapse and
          stable behaviour when formatting changes.
        </p>
      </div>

      <div className="cube-docs-section cube-docs-section--wide cube-docs-section--last">
        <h3 className="cube-docs-section__title">Why ApiResponseViewer is separate</h3>
        <ul className="cube-docs-list">
          <li>
            <strong>JsonCodeView alone</strong> — JSON appears outside HTTP: Redux debug, form
            state, WebSocket messages, Storybook fixtures. No fake <code>status: 200</code>{" "}
            needed.
          </li>
          <li>
            <strong>ApiResponseViewer</strong> — adds status pill, method, URL, headers (popover
            from the summary chevron), and duration around the body (Postman / Chrome Network
            pattern).
          </li>
          <li>
            <strong>CodeBlock</strong> — unrelated to API inspection; for static source in docs
            and examples.
          </li>
        </ul>
      </div>
    </div>
  );
}
