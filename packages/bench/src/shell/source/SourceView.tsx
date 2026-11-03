import React, { useEffect, useState } from "react";
import { EmptyState, FileTypeIcon } from "../../ui/index";
import { CodeEditor } from "../code/CodeEditor";
import { sourceFilesOf } from "./sourceFiles";
import type { SourceKind } from "./sourceFiles";
import { useSource } from "./SourceContext";
import classes from "./SourceView.module.css";

const ICON = { react: "react", ts: "ts", css: "css" } as const;

/** One file's icon: a React file and a TypeScript file have the Figma's; a stylesheet has none, so a glyph of the icon font. */
function FileIcon({ kind }: { kind: SourceKind }) {
  return kind === "css" ? (
    <span className={classes.CssMark} aria-hidden="true">
      css
    </span>
  ) : (
    <FileTypeIcon type={ICON[kind]} size={20} />
  );
}

/**
 * A component's source (Figma 5048:119969, the Component view's pane): a tab for each file in its folder, as the editor has them, and the
 * file's code under them, read only. The files are the folder's own (`Button.tsx`, `ButtonBase.tsx`, `types.ts`…): the component's first.
 * A link to a component in another view (an instance in the Properties) opens its file here.
 */
export function SourceView({ component }: { component: string }) {
  const files = sourceFilesOf(component);
  const source = useSource();
  const [active, setActive] = useState(files[0]?.name ?? "");
  const [text, setText] = useState<string | null>(null);

  // Another component is another folder: start from its own file. A file asked for from elsewhere is the one shown.
  useEffect(() => setActive(sourceFilesOf(component)[0]?.name ?? ""), [component]);
  useEffect(() => {
    const request = source?.request;
    if (request && request.component === component && sourceFilesOf(component).some((file) => file.name === request.file)) setActive(request.file);
  }, [source?.request, component]);

  const file = files.find((candidate) => candidate.name === active) ?? files[0];
  useEffect(() => {
    let current = true;
    setText(null);
    void file?.load().then((loaded) => current && setText(loaded));
    return () => {
      current = false;
    };
  }, [file]);

  if (!file) return <EmptyState layout="compact" icon="code" description={`No source found for ${component}.`} />;
  return (
    <div className={classes.SourceView} data-component="Shell.SourceView">
      <div role="tablist" aria-label={`${component} files`} className={classes.Tabs}>
        {files.map((candidate) => (
          <button key={candidate.name} type="button" role="tab" aria-selected={candidate.name === file.name} className={classes.Tab} onClick={() => setActive(candidate.name)}>
            <FileIcon kind={candidate.kind} />
            <span>{candidate.name}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={file.name} className={classes.Code}>
        {text === null ? null : <CodeEditor key={file.name} readOnly wrap surface="default" plain={file.kind === "css"} value={text} aria-label={`Source: ${file.name}`} />}
      </div>
    </div>
  );
}
