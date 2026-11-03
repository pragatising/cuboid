import type { Resolve } from "./readExample";

/** What an `import` binds: the name it has in the file, where it is from, and the name it has there (`default` for a default import, `*` for a namespace). */
export type Binding = { local: string; from: string; name: string };

/** The names a file's `import` statements bind. Plain text, as the statements are: `import { A as B } from "x"`, `import C from "x"`, `import * as D from "x"`. */
export function readImports(source: string): Binding[] {
  const bindings: Binding[] = [];
  for (const match of source.matchAll(/import\s+(?:type\s+)?([^;'"]+?)\s+from\s+["']([^"']+)["']/g)) {
    const [, clause, from] = match;
    const namespace = /\*\s+as\s+([\w$]+)/.exec(clause);
    if (namespace) bindings.push({ local: namespace[1], from, name: "*" });
    const named = /\{([^}]*)\}/.exec(clause)?.[1];
    for (const item of named?.split(",") ?? []) {
      const [name, local] = item.replace(/^\s*type\s+/, "").trim().split(/\s+as\s+/);
      if (name) bindings.push({ local: local ?? name, from, name });
    }
    const first = clause.split(/[{,]/)[0].trim();
    if (first && !first.startsWith("*") && /^[\w$]+$/.test(first)) bindings.push({ local: first, from, name: "default" });
  }
  return bindings;
}

/**
 * A resolver for the tags of one example: a tag is a component when its first name is imported from one of the configured packages, under the name the package exports
 * it by (`import { Menu as M }`: `M.Item` is `Menu.Item`; `import * as DS`: `DS.Menu` is `Menu`), and the library knows that id. Anything else (a host element, a component
 * the example defines itself, one from another package) is nothing: it is shown as written.
 */
export function componentResolver({ fileSource, packages, known }: { fileSource: string; packages: string[]; known: (id: string) => boolean }): Resolve {
  const bindings = readImports(fileSource).filter((binding) => packages.some((name) => binding.from === name || binding.from.startsWith(`${name}/`)));
  return (tag) => {
    const [head, ...rest] = tag.split(".");
    const binding = bindings.find((found) => found.local === head);
    if (!binding || binding.name === "default") return undefined;
    const id = binding.name === "*" ? rest.join(".") : [binding.name, ...rest].join(".");
    return id && known(id) ? id : undefined;
  };
}
