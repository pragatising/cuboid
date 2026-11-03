import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SRC = resolve(__dirname, "..");
const ENGINE = /^(@tiptap\/|prosemirror)/;

const specifiersOf = (file: string) => {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(/(?:import|export)\s[^"']*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g)].map((m) => m[1] ?? m[2]);
};

const localFile = (from: string, specifier: string) => {
  const base = resolve(dirname(from), specifier);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find((f) => existsSync(f) && statSync(f).isFile()) ?? null;
};

/** Every file and every package reachable from an entry, following relative imports (type-only imports are erased, so they are not followed). */
function reach(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const source = readFileSync(file, "utf8");
    for (const specifier of specifiersOf(file)) {
      if (/import\s+type\s[^;]*from\s+["']/.test(source) && new RegExp(`import\\s+type\\s[^;]*from\\s+["']${specifier.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}["']`).test(source)) continue;
      if (specifier.endsWith(".css")) continue;
      if (specifier.startsWith(".")) {
        const next = localFile(file, specifier);
        if (next) visit(next);
      } else packages.add(specifier);
    }
  };
  visit(entry);
  return { files, packages };
}

describe("the read entry", () => {
  const read = reach(resolve(SRC, "read.ts"));

  it("reaches the real read code, so this check is not vacuous", () => {
    const names = [...read.files].map((f) => f.replace(SRC, ""));
    expect(names).toEqual(expect.arrayContaining(["/read/Read.tsx", "/blocks/read.ts", "/blocks/codeBlock/codeBlock.read.tsx", "/utils/palette.ts"]));
  });

  it("imports nothing from the editing engine", () => {
    expect([...read.packages].filter((p) => ENGINE.test(p))).toEqual([]);
  });

  it("reaches no write module", () => {
    const writes = [...read.files].map((f) => f.replace(SRC, "")).filter((f) => f.startsWith("/write/") || f.startsWith("/Editor/") || (f.startsWith("/blocks/") && !f.includes(".read") && !f.endsWith("/read.ts")));
    expect(writes).toEqual([]);
  });

  it("is a different set from the write entry, which does reach the engine", () => {
    const write = reach(resolve(SRC, "index.ts"));
    expect([...write.packages].some((p) => ENGINE.test(p))).toBe(true);
    expect(write.files.size).toBeGreaterThan(read.files.size);
  });
});
