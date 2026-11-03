import json from "./json.svg";
import ts from "./ts.svg";
import html from "./html.svg";
import js from "./js.svg";
import react from "./react.png";
import component from "./component.svg";
import instance from "./instance.svg";
import doc from "./doc.svg";
import examples from "./examples.svg";

/**
 * What a file or a node is, as the Figma draws it (FileType, 5004:29558). Code mode: `json`, `ts`, `html`, `js`, `react` (a `.tsx` file), `doc`.
 * Design mode: a `component` is what a `.tsx` file that exports one becomes, an `instance` is one drawn on the canvas, and `examples`
 * are its frames. Material Symbols has no glyph for these, so they are drawn from the Figma's own artwork.
 */
export const FILE_TYPES = ["json", "ts", "html", "js", "react", "component", "instance", "doc", "examples"] as const;
export type FileType = (typeof FILE_TYPES)[number];

/** The mode each type is drawn in: code is what a file is, design is what it becomes on the canvas. */
export const FILE_TYPE_MODE: Record<FileType, "code" | "design"> = {
  json: "code",
  ts: "code",
  html: "code",
  js: "code",
  react: "code",
  doc: "code",
  component: "design",
  instance: "design",
  examples: "design",
};

export const FILE_TYPE_SOURCES: Record<FileType, string> = { json, ts, html, js, react, component, instance, doc, examples };
