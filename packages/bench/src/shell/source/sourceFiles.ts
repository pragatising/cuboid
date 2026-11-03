import modelsJson from "~bench/generated/models.json";
import { sources } from "virtual:bench";

/** What a file is, for its icon: a React file (`.tsx`), a TypeScript one, a stylesheet. */
export type SourceKind = "react" | "ts" | "css";

/** One file of a component's folder: its name, what it is, and its text, which loads when it is asked for. */
export type SourceFile = { name: string; kind: SourceKind; load: () => Promise<string> };

type Declared = Record<string, string>;
const declared = (modelsJson as unknown as { exports: Declared }).exports;

/** `src/components/core/Button/Button.tsx#Button` is `src/components/core/Button`: the folder a component is written in. */
const folderOf = (id: string) => id.split("#")[0].split("/").slice(0, -1).join("/");
/** A folder as the globbed paths have it: without the `../editor/` that reaches another package from the first. */
const bare = (folder: string) => folder.replace(/^(\.\.\/[^/]+\/)+/, "");

const kindOf = (name: string): SourceKind => (name.endsWith(".css") ? "css" : name.endsWith(".tsx") ? "react" : "ts");
/** The component's own file first, then the other components and the rest, as the folder's tabs. */
const order = (name: string, main: string) => (name === main ? 0 : name.endsWith(".tsx") ? 1 : name.endsWith(".ts") ? 2 : 3);

/**
 * The files written in a component's folder, as the tabs of its source: the component's own first (`Button.tsx`), then the others
 * (`ButtonBase.tsx`, `types.ts`, the stylesheets). Only the folder's own files: what is in a folder inside it belongs to the part that has it.
 */
export function sourceFilesOf(component: string, files: Record<string, () => Promise<string>> = sources, ids: Declared = declared): SourceFile[] {
  const id = ids[component];
  if (!id) return [];
  const folder = bare(folderOf(id));
  const main = `${component}.tsx`;
  return Object.entries(files)
    .flatMap(([path, load]) => {
      const at = path.lastIndexOf(`/${folder}/`);
      if (at < 0) return [];
      const name = path.slice(at + folder.length + 2);
      return name.includes("/") ? [] : [{ name, kind: kindOf(name), load }];
    })
    .sort((a, b) => order(a.name, main) - order(b.name, main) || a.name.localeCompare(b.name));
}

/**
 * Where a component the code refers to is written, for a link to its source: the page of the component whose folder has it, and the file in it.
 * `src/components/core/Button/ButtonBase.tsx#ButtonBase` is the Button page, file `ButtonBase.tsx`. Null when no page has that folder.
 */
export function locate(id: string | undefined, ids: Declared = declared): { component: string; file: string } | null {
  if (!id) return null;
  const folder = folderOf(id);
  const owners = Object.entries(ids).filter(([, other]) => folderOf(other) === folder);
  if (owners.length === 0) return null;
  const leaf = folder.split("/").pop();
  const [component] = owners.find(([name]) => name === leaf) ?? owners[0];
  return { component, file: id.split("#")[0].split("/").pop() ?? "" };
}
