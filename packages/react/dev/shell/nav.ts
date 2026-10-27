/**
 * The sidebar's contents, derived from the code: every component that has a story file is a page. Nothing is listed by hand,
 * so a new component appears here by existing (the experiment's principle: derived, not authored).
 */
const stories = import.meta.glob("../../src/components/**/*.stories.tsx");

export type NavItem = { name: string };
export type NavSection = { id: string; label: string; items: NavItem[] };

/** `…/components/core/Button/Button.stories.tsx` is `Button` in "Core"; `…/components/CodeBlock/…` is `CodeBlock` in "Data and code". */
export function buildNav(paths: string[] = Object.keys(stories)): NavSection[] {
  const sections = new Map<string, NavSection>();
  for (const path of paths) {
    const parts = path.split("/components/")[1]?.split("/");
    if (!parts || parts.length < 2) continue;
    const core = parts[0] === "core";
    const name = core ? parts[1] : parts[0];
    if (core && parts.length < 3) continue;
    const id = core ? "core" : "other";
    const section = sections.get(id) ?? { id, label: core ? "Core" : "Data and code", items: [] };
    if (!section.items.some((item) => item.name === name)) section.items.push({ name });
    sections.set(id, section);
  }
  for (const section of sections.values()) section.items.sort((a, b) => a.name.localeCompare(b.name));
  return [...sections.values()].sort((a, b) => (a.id === "core" ? -1 : b.id === "core" ? 1 : a.label.localeCompare(b.label)));
}
