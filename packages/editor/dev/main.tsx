import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useEditor } from "@tiptap/react";
import "@sragatiping/cuboid-primitives/css/theme.css";
import "@sragatiping/cuboid-primitives/icons/icon-fonts.css";
import { setMode } from "@sragatiping/cuboid";
import { Editor, Read, SlashCommand, extensionsFor, migrateBlocks } from "../src";
import type { DocNode } from "../src";
import { OLD_PAGE } from "./samplePage";

setMode("light");


const { doc: START, issues: ISSUES } = migrateBlocks(OLD_PAGE);

const page: React.CSSProperties = { fontFamily: "Inter, system-ui, sans-serif", fontSize: 16, lineHeight: 1.6, color: "var(--cube-fgColor-neutral-default)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, padding: "48px 24px 48px 96px" };

function App() {
  const [doc, setDoc] = useState<DocNode>(START);
  const editor = useEditor({
    extensions: [...extensionsFor(), SlashCommand],
    content: START,
    onUpdate: ({ editor: e }) => setDoc(e.getJSON() as DocNode),
  });
  if (!editor) return null;
  return (
    <div style={page}>
      <section aria-label="Write">
        <h2 style={{ font: "inherit", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--cube-fgColor-neutral-muted)" }}>Write</h2>
        <Editor.Surface editor={editor} />
      </section>
      <section aria-label="Read">
        <h2 style={{ font: "inherit", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--cube-fgColor-neutral-muted)" }}>Read (same JSON, no editor engine)</h2>
        <Read node={doc} />
        <h2 style={{ font: "inherit", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "var(--cube-fgColor-neutral-muted)" }}>Migration report ({ISSUES.length})</h2>
        <ul style={{ fontSize: 13, paddingLeft: 18 }}>
          {ISSUES.map((issue, i) => (
            <li key={i}>
              <b>{issue.kind}</b> · {issue.tag}: {issue.message}
            </li>
          ))}
        </ul>
        <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 280, background: "var(--cube-bgColor-canvas-inset)", padding: 12, borderRadius: 8 }}>{JSON.stringify(doc, null, 2)}</pre>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
