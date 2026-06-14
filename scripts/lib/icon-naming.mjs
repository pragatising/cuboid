import fs from "node:fs";
import path from "node:path";

const FILLED_SUFFIXES = ["-fill", "-filled"];

/** Normalize Figma symbol name → `{ base, filled }`. */
export function parseFigmaIconName(figmaName) {
  let base = figmaName.trim();
  let filled = false;

  for (const suffix of FILLED_SUFFIXES) {
    if (base.endsWith(suffix)) {
      filled = true;
      base = base.slice(0, -suffix.length);
      break;
    }
  }

  return { base, filled, figmaName };
}

/** Figma/legacy names → Material Symbols Rounded slug (kebab-case file name). */
export function normalizeToMaterialSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function kebabToPascal(kebab) {
  return kebab
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Read `Close` / `CloseFill` export aliases from the Material package. */
export function readMaterialSymbolExports(slug, materialIconsDir) {
  const dtsPath = path.join(materialIconsDir, `${slug}.d.ts`);
  if (!fs.existsSync(dtsPath)) {
    return null;
  }

  const text = fs.readFileSync(dtsPath, "utf8");
  const aliases = [...text.matchAll(/\b\w+W400 as (\w+)/g)].map((match) => match[1]);
  if (!aliases.length) return null;

  const fill = aliases.find((name) => name.endsWith("Fill"));
  const outline = aliases.find((name) => name !== fill && !name.endsWith("Fill"));

  return {
    slug,
    outline: outline ?? aliases[0],
    fill: fill ?? null,
  };
}

/** Common Figma labels → Material slug when direct kebab match is missing. */
export const MATERIAL_SLUG_SYNONYMS = {
  account: "account-circle",
  calendar: "calendar-month",
  "chevron-down": "keyboard-arrow-down",
  "chevron-up": "keyboard-arrow-up",
  copy: "content-copy",
  document: "description",
  message: "chat",
  minus: "remove",
  plus: "add",
  shopping: "shopping-bag",
  text: "text-fields",
  "arrow-drop-left": "arrow-left",
  "arrow-drop-right": "arrow-right",
  "apps-user-management": "manage-accounts",
  tips: "lightbulb",
  "tips-and-updates": "lightbulb",
  "wand-stars": "wand-stars",
  "auto-awesome": "wand-stars",
};

export function resolveMaterialSlug(figmaBase, overrides) {
  const normalized = normalizeToMaterialSlug(figmaBase);
  return (
    overrides[figmaBase] ??
    overrides[normalized] ??
    MATERIAL_SLUG_SYNONYMS[normalized] ??
    normalized
  );
}

/** PascalCase export from Figma base name (kebab / spaces / snake → `-`). */
export function cubeExportNameFromFigma(figmaBase) {
  return `${kebabToPascal(normalizeToMaterialSlug(figmaBase))}Icon`;
}

/** @deprecated Use cubeExportNameFromFigma — kept for callers keyed on Material export names. */
export function cubeExportName(materialSymbolName) {
  return `${materialSymbolName}Icon`;
}
