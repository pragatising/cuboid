/**
 * What the Anatomy pane shows of an example: the example as it is written, with the imports it uses. An example is an ordinary
 * function component in a `*.examples.tsx` file (real imports, real hooks, the component used as an app uses it), so there is
 * nothing to cut out of a wrapper: the function is shown verbatim and its imports are the ones its body mentions.
 *
 * The function keeps its own lines, so a position the Babel step recorded (dev/storySource.ts) still points at the right text.
 * `lineMap[i]` says which line of the file displayed line `i` came from, or null for a line made here (an import, a blank).
 */
export type ExampleCode = {
  name: string;
  code: string;
  lineMap: (number | null)[];
};

const skipString = (text: string, from: number) => {
  const quote = text[from];
  let i = from + 1;
  while (i < text.length && text[i] !== quote) i += text[i] === "\\" ? 2 : 1;
  return i + 1;
};

/** From an opening bracket, the index just after its match, skipping strings. */
function skipBalanced(text: string, from: number, open: string, close: string) {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(text, i) - 1;
    else if (c === open) depth += 1;
    else if (c === close && --depth === 0) return i + 1;
  }
  return text.length;
}

type Import = {
  typeOnly: boolean;
  defaultName?: string;
  namespace?: string;
  named: { imported: string; local: string }[];
  from: string;
};

/** The import statements at the top of a file. Side-effect imports (`import "./x.css"`) are not an example's concern and are left out. */
export function parseImports(text: string): Import[] {
  const imports: Import[] = [];
  for (const match of text.matchAll(
    /^import\s+(type\s+)?([^"'`;]*?)\s+from\s+["']([^"']+)["'];?/gm,
  )) {
    const [, type, clause, from] = match;
    const entry: Import = { typeOnly: Boolean(type), named: [], from };
    const braces = /\{([^}]*)\}/.exec(clause);
    if (braces) {
      for (const part of braces[1].split(",")) {
        const [imported, , local] = part.trim().split(/\s+(as\s+)?/);
        if (imported)
          entry.named.push({
            imported: imported.replace(/^type\s+/, ""),
            local: local ?? imported.replace(/^type\s+/, ""),
          });
      }
    }
    const outside = clause
      .replace(/\{[^}]*\}/, "")
      .trim()
      .replace(/,\s*$/, "");
    const namespace = /\*\s+as\s+(\w+)/.exec(outside);
    if (namespace) entry.namespace = namespace[1];
    else if (outside) entry.defaultName = outside.replace(/,/g, "").trim();
    imports.push(entry);
  }
  return imports;
}

const mentions = (body: string, name: string) =>
  new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, "\\$")}(?![\\w$])`).test(body);

/** The import lines a body needs: each statement cut down to the names the body mentions, and dropped if it has none. */
export function importsFor(imports: Import[], body: string): string[] {
  return imports.flatMap((entry) => {
    const named = entry.named.filter((n) => mentions(body, n.local));
    const keepDefault =
      entry.defaultName && mentions(body, entry.defaultName)
        ? entry.defaultName
        : undefined;
    const keepNamespace =
      entry.namespace && mentions(body, entry.namespace)
        ? entry.namespace
        : undefined;
    if (named.length === 0 && !keepDefault && !keepNamespace) return [];
    const parts = [
      keepDefault,
      keepNamespace ? `* as ${keepNamespace}` : undefined,
      named.length > 0
        ? `{ ${named.map((n) => (n.imported === n.local ? n.imported : `${n.imported} as ${n.local}`)).join(", ")} }`
        : undefined,
    ].filter(Boolean);
    return [
      `import ${entry.typeOnly ? "type " : ""}${parts.join(", ")} from "${entry.from}";`,
    ];
  });
}

const lineOf = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

/** An example's code: the imports its function needs, a blank line, and the function itself (`export function Name() { … }`), verbatim. */
export function exampleCode(text: string, name: string): ExampleCode | null {
  const declaration = new RegExp(
    `^export (?:default )?(?:function ${name}\\b|const ${name}\\b)`,
    "m",
  ).exec(text);
  if (!declaration) return null;
  const start = declaration.index;
  const parameters = text.indexOf(
    "(",
    start +
      declaration[0].length -
      (declaration[0].endsWith(name) ? name.length : 0),
  );
  const afterParameters =
    parameters === -1 ? start : skipBalanced(text, parameters, "(", ")");
  const body = text.indexOf("{", afterParameters);
  if (body === -1) return null;
  const end = skipBalanced(text, body, "{", "}");
  const source = text.slice(start, end);

  const imports = importsFor(parseImports(text), source);
  const fileLine = lineOf(text, start);
  const functionLines = source.split("\n");
  const lead = imports.length > 0 ? [...imports, ""] : [];
  return {
    name,
    code: [...lead, ...functionLines].join("\n"),
    lineMap: [
      ...lead.map(() => null),
      ...functionLines.map((_, i) => fileLine + i),
    ],
  };
}

/** The examples a file exports, in order: `export function Name`, or `export const Name =`. The first is the default. */
export function exampleNames(text: string): string[] {
  return [...text.matchAll(/^export (?:function|const) ([A-Z]\w*)/gm)].map(
    (match) => match[1],
  );
}
