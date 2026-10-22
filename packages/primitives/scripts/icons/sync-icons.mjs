#!/usr/bin/env node
/**
 * Cross-reference icons/figma-icons.json against Material Symbols' own
 * canonical manifest and produce:
 *
 *  - icons/material/iconNames.generated.ts — the `IconName` union (source
 *    of truth: Material's icon-index.json, NOT Figma — see generate-icon-names.mjs)
 *  - icons/manifest.json — Figma name → canonical IconName + filled flag,
 *    for design-tool tooling only (Figma→Cube name lookup). This is NOT where
 *    `IconName` comes from; it just maps Figma's design-tool names onto it.
 *  - icons/custom/pending.json — Figma icons with no Material match.
 *
 * Naming rules (unchanged from the old SVG-export pipeline):
 * - Figma kebab/snake/spaces → Material slug (kebab-case)
 * - `-fill` / `-filled` suffix → same glyph, `filled: true` (fill is now a
 *   render-time axis, not a separate glyph/export)
 * - icons/material/overrides.json → manual Figma → Material slug fixes
 *
 *   npm run icons:sync
 */
import fs from "node:fs";
import path from "node:path";
import {
  parseFigmaIconName,
  resolveCanonicalIconName,
  resolveMaterialSlug,
} from "./lib/icon-naming.mjs";
import { loadCanonicalIconNames, writeIconNames } from "./generate-icon-names.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const REGISTRY_FILE = path.join(ROOT, "icons/figma-icons.json");
const OVERRIDES_FILE = path.join(ROOT, "icons/material/overrides.json");
const MANIFEST_FILE = path.join(ROOT, "icons/manifest.json");
const PENDING_FILE = path.join(ROOT, "icons/custom/pending.json");

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function resolveIcon(figmaEntry, overrides, canonicalNames) {
  const { base, filled, figmaName } = parseFigmaIconName(figmaEntry.figmaName);
  const slug = resolveMaterialSlug(base, overrides);
  const name = resolveCanonicalIconName(slug, canonicalNames);

  if (!name) {
    return {
      ok: false,
      figmaName,
      slug,
      reason: "not-in-material-manifest",
    };
  }

  return {
    ok: true,
    figmaName,
    category: figmaEntry.category ?? "Uncategorized",
    slug,
    filled,
    name,
  };
}

function generateManifest(resolvedIcons) {
  const manifest = {};

  for (const icon of resolvedIcons) {
    manifest[icon.figmaName] = {
      name: icon.name,
      category: icon.category,
      filled: icon.filled,
    };
  }

  return manifest;
}

function main() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    console.error(`Missing ${path.relative(ROOT, REGISTRY_FILE)} — run npm run icons:extract first.`);
    process.exit(1);
  }

  // 1. Refresh the canonical IconName union from Material's own manifest.
  const canonicalNameList = loadCanonicalIconNames();
  const canonicalNames = new Set(canonicalNameList);
  const iconNameFiles = writeIconNames(canonicalNameList);

  // 2. Cross-reference Figma's design-tool names against that canonical set.
  const registry = loadJson(REGISTRY_FILE);
  const overrides = loadJson(OVERRIDES_FILE);

  const resolved = [];
  const pending = [];

  for (const entry of registry.icons ?? []) {
    const result = resolveIcon(entry, overrides, canonicalNames);
    if (result.ok) {
      resolved.push(result);
    } else {
      pending.push({
        ...result,
        category: entry.category ?? "Uncategorized",
      });
    }
  }

  resolved.sort((a, b) => a.figmaName.localeCompare(b.figmaName));

  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(generateManifest(resolved), null, 2)}\n`);

  fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true });
  fs.writeFileSync(
    PENDING_FILE,
    `${JSON.stringify(
      {
        note: "Figma icons with no match in Material Symbols' own manifest — implement under icons/custom/",
        icons: pending.sort((a, b) => a.figmaName.localeCompare(b.figmaName)),
      },
      null,
      2
    )}\n`
  );

  console.log(`Generated ${canonicalNameList.length} canonical icon names`);
  for (const file of iconNameFiles) console.log(`  → ${path.relative(ROOT, file)}`);
  console.log(`Cross-referenced ${resolved.length} Figma icons against the Material manifest`);
  console.log(`  → ${path.relative(ROOT, MANIFEST_FILE)}`);

  if (pending.length) {
    console.warn(`\n${pending.length} Figma icons need custom SVG or overrides:`);
    for (const item of pending.slice(0, 15)) {
      console.warn(`  - ${item.figmaName} → ${item.slug} (${item.reason})`);
    }
    if (pending.length > 15) {
      console.warn(`  … and ${pending.length - 15} more (see ${path.relative(ROOT, PENDING_FILE)})`);
    }
  }
}

main();
