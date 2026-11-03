// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Bench shows any library, so what Bench is made of names none (ADR-10). This reads Bench's own sources and fails where one has crept in: an import of a library, a
 * name or a layout or a convention that only one library has. It needs no library to run.
 */
const root = path.resolve(__dirname);
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return ["ui", "dist", "test", "node_modules"].includes(entry.name) && dir === root ? [] : entry.name === "node_modules" ? [] : files(full);
    return /\.(ts|tsx|mjs|css)$/.test(entry.name) && !/\.(test|conformance)\.|\.d\.m?ts$/.test(entry.name) ? [full] : [];
  });
const sources = files(root).map((file) => ({ file: path.relative(root, file), text: fs.readFileSync(file, "utf8") }));
const inFolders = (folders: string[]) => sources.filter(({ file }) => folders.some((folder) => file.startsWith(`${folder}/`)));

/**
 * The only files that name the token package Bench's own interface is built on (`ui/`, which is Bench's own kit and is not scanned, takes its tokens from it): they
 * give Bench's shell and theme their look. It is Bench's own foundation, not the library being shown; it is the one dependency on a design system that is left, and it
 * is listed so that it cannot spread.
 */
const OWN_FOUNDATION = ["shell/main.tsx", "scripts/theme.ts"];

describe("what Bench is made of knows no library", () => {
  it("scans the sources it means to", () => {
    expect(sources.length).toBeGreaterThan(100);
    expect(sources.some(({ file }) => file.startsWith("engine/api/"))).toBe(true);
    expect(sources.some(({ file }) => file.startsWith("ui/"))).toBe(false);
  });

  it("imports no library, and names none, outside its own foundation", () => {
    const named = sources.filter(({ file, text }) => !OWN_FOUNDATION.includes(file) && /cuboid/i.test(text)).map(({ file }) => file);
    expect(named).toEqual([]);
  });

  it("keeps a library's folder layout, naming rules and token calls out of what reads code", () => {
    const rules: [RegExp, string][] = [
      [/\bownerOf\b/, "a component taken from the folder its file is in"],
      [/\bdeclaredBy\b/, "a props type taken as a component by its name"],
      [/components\\?\/\[\^/, "a folder layout written as a pattern"],
      [/\bresolved</, "a library's token call"],
      [/\bProps\$|\(\.\+\)Props/, "`XProps` read as the props of `X`"],
    ];
    const found = inFolders(["engine", "scripts"]).flatMap(({ file, text }) => rules.filter(([rule]) => rule.test(text)).map(([, why]) => `${file}: ${why}`));
    expect(found).toEqual([]);
  });

  it("asks a library for what only the library knows, through its config", () => {
    // The page inside a frame loads the styles the config lists, not a package it names itself.
    const frame = sources.find(({ file }) => file === "frame/document/main.tsx")!;
    expect(frame.text).toContain("virtual:bench-styles");
  });
});
