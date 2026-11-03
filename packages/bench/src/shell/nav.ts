import modelsJson from "~bench/generated/models.json";
import { config } from "virtual:bench";
import type { BenchPackage } from "../config";

/**
 * The sidebar's contents, derived from the code: every component a package exports is a page, in the section its source file is in.
 * Nothing is listed by hand and nothing needs a story or an example beside it, so a new component appears here by existing. Where the
 * packages are and what their sections are called is the config (`bench.config.ts`, in the package that runs Bench).
 */
export type NavItem = { name: string };
export type NavSection = { id: string; label: string; items: NavItem[] };

/** Where each export is written (`declared`, relative to the first package's folder), by name: what `generated/models.json` says. */
type Declared = Record<string, string>;

/** A path with its `.` and `..` resolved: `../editor/./src` is `../editor/src`. */
function normalise(path: string): string {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === ".." && out.length > 0 && out[out.length - 1] !== "..")
      out.pop();
    else out.push(part);
  }
  return out.join("/");
}

/** Where a package's components are, relative to the first package's folder (the one `declared` paths are relative to). */
function componentsOf(first: BenchPackage, pkg: BenchPackage): string {
  const from = normalise(first.root).split("/").filter(Boolean);
  const to = normalise(`${pkg.root}/${pkg.components}`)
    .split("/")
    .filter(Boolean);
  let shared = 0;
  while (
    shared < from.length &&
    shared < to.length &&
    from[shared] === to[shared]
  )
    shared++;
  return normalise(
    [...from.slice(shared).map(() => ".."), ...to.slice(shared)].join("/"),
  );
}

/** The section a file is in, from where it is: `<components>/<folder>/Name/Name.tsx`, or `<components>/Name/…` for a package's other section. */
function place(
  pkg: BenchPackage,
  components: string,
  file: string,
): string | null {
  const prefix = components === "" ? "" : `${components}/`;
  if (!file.startsWith(prefix)) return null;
  const parts = file.slice(prefix.length).split("/");
  const folder = pkg.sections.find((section) => section.folder === parts[0]);
  // A folder of sections' own holds components a level down; without one the component's folder is the first.
  if (folder) return parts.length >= 3 ? folder.id : null;
  const rest = pkg.sections.find((section) => !section.folder);
  return rest && parts.length >= 2 ? rest.id : null;
}

export function buildNav(
  packages: BenchPackage[] = config.packages,
  declared: Declared = (modelsJson as unknown as { exports: Declared }).exports,
): NavSection[] {
  const sections = new Map<string, NavSection>(
    packages.flatMap((pkg) =>
      pkg.sections.map(
        (section) =>
          [
            section.id,
            { id: section.id, label: section.label, items: [] },
          ] as const,
      ),
    ),
  );
  // The deepest components folder that holds a file is its package's: one package's folder can sit inside another's.
  const folders = packages
    .map((pkg) => ({ pkg, components: componentsOf(packages[0], pkg) }))
    .sort((a, b) => b.components.length - a.components.length);
  for (const [name, model] of Object.entries(declared)) {
    const file = normalise(model.split("#")[0]);
    const owner = folders.find(
      ({ components }) =>
        components === "" || file.startsWith(`${components}/`),
    );
    const id = owner && place(owner.pkg, owner.components, file);
    const section = id ? sections.get(id) : undefined;
    if (section) section.items.push({ name });
  }
  for (const section of sections.values())
    section.items.sort((a, b) => a.name.localeCompare(b.name));
  return [...sections.values()].filter((section) => section.items.length > 0);
}
