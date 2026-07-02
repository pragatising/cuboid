#!/usr/bin/env node
/**
 * Merge tokens/base/light.json, tokens/functional/colors/globals.json,
 * and every .json file under tokens/functional/components/ (recursive); resolve
 * {token.path} refs; write src/theme/output/theme.json (foundation),
 * token-output.json (component tokens), and base.json.
 *
 * Usage: node scripts/build-theme.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildSpaceScaleFromPxSpace } from "./lib/spaceScale.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const isPlain = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/** Map Figma / file scale names to keys used in ThemeTokens["colors"]["base"] */
const BASE_SCALE_ALIASES = {
  purples: "purple",
};

const PX_TO_REM_BASE = Number(process.env.SIZE_BASE_PX ?? 16);
if (!Number.isFinite(PX_TO_REM_BASE) || PX_TO_REM_BASE <= 0) {
  console.error(`Invalid SIZE_BASE_PX: ${process.env.SIZE_BASE_PX}`);
  process.exit(1);
}

function pxStringToRem(val) {
  if (typeof val === "number") {
    const rem = val / PX_TO_REM_BASE;
    const rounded = Math.round(rem * 10000) / 10000;
    return `${rounded}rem`;
  }
  if (typeof val !== "string") return val;
  const m = val.match(/^(\d+(?:\.\d+)?)px$/);
  if (!m) return val;
  const px = Number(m[1]);
  const rem = px / PX_TO_REM_BASE;
  const rounded = Math.round(rem * 10000) / 10000;
  return `${rounded}rem`;
}

function deepMerge(a, b) {
  if (!isPlain(a)) return b;
  if (!isPlain(b)) return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (isPlain(v) && isPlain(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}

/** Convert any plain "<number>px" strings to rem recursively. */
function convertPxToRemDeep(node) {
  if (typeof node === "string") return pxStringToRem(node);
  if (!isPlain(node)) return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = convertPxToRemDeep(v);
  return out;
}

function getPath(root, parts) {
  let cur = root;
  for (const p of parts) {
    if (!isPlain(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveOnce(root, node) {
  if (!isPlain(node)) return node;
  if (typeof node.value === "string") {
    const m = node.value.match(/^\{([^}]+)\}$/);
    if (m) {
      const targetPath = m[1].split(".");
      const target = getPath(root, targetPath);
      if (
        isPlain(target) &&
        typeof target.value === "string" &&
        !/^\{[^}]+\}$/.test(target.value)
      ) {
        return { value: target.value };
      }
    }
    return node;
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = resolveOnce(root, v);
  }
  return out;
}

function collectUnresolved(node, prefix = []) {
  const list = [];
  if (!isPlain(node)) return list;
  if (typeof node.value === "string" && /^\{[^}]+\}$/.test(node.value)) {
    list.push(`${prefix.join(".") || "(root)"} = ${node.value}`);
  }
  for (const [k, v] of Object.entries(node)) {
    list.push(...collectUnresolved(v, [...prefix, k]));
  }
  return list;
}

/** Collapse { value: x } leaves to primitives (and recurse). */
function unwrap(node) {
  if (!isPlain(node)) return node;
  if (
    Object.keys(node).length === 1 &&
    (typeof node.value === "string" ||
      typeof node.value === "number" ||
      typeof node.value === "boolean") &&
    (typeof node.value !== "string" || !node.value.startsWith("{"))
  ) {
    return node.value;
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = unwrap(v);
  }
  return out;
}

function walkTokenFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTokenFiles(p, acc);
    else if (ent.name.endsWith(".json")) acc.push(p);
  }
  return acc;
}

function walkJsonFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkJsonFiles(p, acc);
    else if (ent.name.endsWith(".json")) acc.push(p);
  }
  return acc;
}

function themeBaseFromUnwrappedScale(scaleObj) {
  const out = {};
  if (!isPlain(scaleObj)) return out;
  for (const [scaleName, stops] of Object.entries(scaleObj)) {
    const themeName = BASE_SCALE_ALIASES[scaleName] ?? scaleName;
    if (!isPlain(stops)) continue;
    const row = {};
    for (const [stop, val] of Object.entries(stops)) {
      if (typeof val === "string") row[stop] = val;
    }
    if (Object.keys(row).length) out[themeName] = row;
  }
  return out;
}

/** Palette keys from tokens/functional/colors/globals.json (not component color.*). */
const GLOBAL_COLOR_ROOT_KEYS = [
  "primary",
  "black",
  "white",
  "focus",
  "success",
  "warning",
  "error",
  "info",
  "fg",
  "text",
  "canvas",
  "border",
  "bg",
  "syntax",
];

function pickGlobalColors(color) {
  const out = {};
  for (const key of GLOBAL_COLOR_ROOT_KEYS) {
    if (color[key] !== undefined) out[key] = color[key];
  }
  return out;
}

function assertGlobalColorLeaves(node, path) {
  if (typeof node === "string") return;
  if (!isPlain(node)) {
    console.error(`Expected globalColors.${path} to resolve to a color string or nested object`);
    process.exit(1);
  }
  for (const [k, v] of Object.entries(node)) {
    assertGlobalColorLeaves(v, path ? `${path}.${k}` : k);
  }
}

function main() {
  const lightPath = path.join(ROOT, "tokens/base/light.json");
  const globalsPath = path.join(ROOT, "tokens/functional/colors/globals.json");
  const rawTypographyPath = path.join(ROOT, "tokens/functional/typography/typography.json");
  const typographyPath = path.join(ROOT, "tokens/functional/typography/theme.tokens.json");
  const componentsDir = path.join(ROOT, "tokens/functional/components");
  const functionalSizeDir = path.join(ROOT, "tokens/functional/size");
  const functionalShadowsDir = path.join(ROOT, "tokens/functional/shadows");
  const themeOutputDir = path.join(ROOT, "src/theme/output");
  const outPath = path.join(themeOutputDir, "theme.json");
  const tokenOutPath = path.join(themeOutputDir, "token-output.json");
  const baseOutPath = path.join(themeOutputDir, "base.json");

  if (!fs.existsSync(lightPath)) {
    console.error(`Missing ${lightPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(globalsPath)) {
    console.error(`Missing ${globalsPath}`);
    process.exit(1);
  }

  const light = JSON.parse(fs.readFileSync(lightPath, "utf8"));
  const globals = JSON.parse(fs.readFileSync(globalsPath, "utf8"));
  const rawTypography = fs.existsSync(rawTypographyPath)
    ? JSON.parse(fs.readFileSync(rawTypographyPath, "utf8"))
    : null;
  const typographyThemeFile = fs.existsSync(typographyPath)
    ? JSON.parse(fs.readFileSync(typographyPath, "utf8"))
    : null;

  if (!isPlain(light.base)) {
    console.error("light.json: expected top-level base");
    process.exit(1);
  }
  if (!isPlain(globals.color)) {
    console.error("globals.json: expected top-level color");
    process.exit(1);
  }

  let mergedColor = { ...globals.color };
  /** Component-owned size fragments merged into `root.size` (e.g. `tooltip.sizes` → `sizes.tooltip`). */
  let componentLayoutMerge = {};
  for (const file of walkTokenFiles(componentsDir)) {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    if (isPlain(doc.color)) {
      mergedColor = deepMerge(mergedColor, doc.color);
    }
    if (isPlain(doc.tooltip)) {
      if (isPlain(doc.tooltip.color)) {
        mergedColor = deepMerge(mergedColor, { tooltip: doc.tooltip.color });
      }
      if (isPlain(doc.tooltip.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { tooltip: doc.tooltip.sizes });
      }
    }
    if (isPlain(doc.pill)) {
      if (isPlain(doc.pill.color)) {
        mergedColor = deepMerge(mergedColor, { pill: doc.pill.color });
      }
      if (isPlain(doc.pill.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { pill: doc.pill.sizes });
      }
    }
    if (isPlain(doc.breadcrumb)) {
      if (isPlain(doc.breadcrumb.color)) {
        mergedColor = deepMerge(mergedColor, { breadcrumb: doc.breadcrumb.color });
      }
      if (isPlain(doc.breadcrumb.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { breadcrumb: doc.breadcrumb.sizes });
      }
    }
    if (isPlain(doc.table)) {
      if (isPlain(doc.table.color)) {
        mergedColor = deepMerge(mergedColor, { table: doc.table.color });
      }
      if (isPlain(doc.table.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { table: doc.table.sizes });
      }
    }
    if (isPlain(doc.siteHeader)) {
      if (isPlain(doc.siteHeader.color)) {
        mergedColor = deepMerge(mergedColor, { siteHeader: doc.siteHeader.color });
      }
      if (isPlain(doc.siteHeader.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { siteHeader: doc.siteHeader.sizes });
      }
    }
    if (isPlain(doc.overlay)) {
      if (isPlain(doc.overlay.color)) {
        mergedColor = deepMerge(mergedColor, { overlay: doc.overlay.color });
      }
    }
    if (isPlain(doc.sheet)) {
      if (isPlain(doc.sheet.color)) {
        mergedColor = deepMerge(mergedColor, { sheet: doc.sheet.color });
      }
      if (isPlain(doc.sheet.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { sheet: doc.sheet.sizes });
      }
    }
    if (isPlain(doc.popover)) {
      if (isPlain(doc.popover.color)) {
        mergedColor = deepMerge(mergedColor, { popover: doc.popover.color });
      }
      if (isPlain(doc.popover.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { popover: doc.popover.sizes });
      }
    }
    if (isPlain(doc.actionMenu)) {
      if (isPlain(doc.actionMenu.color)) {
        mergedColor = deepMerge(mergedColor, { actionMenu: doc.actionMenu.color });
      }
      if (isPlain(doc.actionMenu.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { actionMenu: doc.actionMenu.sizes });
      }
    }
    if (isPlain(doc.sidebar)) {
      if (isPlain(doc.sidebar.color)) {
        mergedColor = deepMerge(mergedColor, { sidebar: doc.sidebar.color });
      }
      if (isPlain(doc.sidebar.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { sidebar: doc.sidebar.sizes });
      }
    }
    if (isPlain(doc.highlight)) {
      if (isPlain(doc.highlight.color)) {
        mergedColor = deepMerge(mergedColor, { highlight: doc.highlight.color });
      }
    }
  }

  const mergedTypography = isPlain(typographyThemeFile?.typography)
    ? typographyThemeFile.typography
    : null;

  let functionalSize = {};
  for (const file of walkJsonFiles(functionalSizeDir)) {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isPlain(doc)) continue;
    // Merge size tokens into one namespace
    functionalSize = deepMerge(functionalSize, doc);
  }
  functionalSize = deepMerge(functionalSize, componentLayoutMerge);

  let mergedShadows = {};
  for (const file of walkJsonFiles(functionalShadowsDir)) {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    if (isPlain(doc.shadows)) {
      mergedShadows = deepMerge(mergedShadows, doc.shadows);
    }
  }

  const root = {
    base: light.base,
    color: mergedColor,
    size: functionalSize,
    shadows: mergedShadows,
    typography: mergedTypography ?? {},
  };

  let resolved = root;
  for (let i = 0; i < 100; i++) {
    const next = resolveOnce(resolved, resolved);
    if (JSON.stringify(next) === JSON.stringify(resolved)) break;
    resolved = next;
  }

  const unresolved = collectUnresolved(resolved);
  if (unresolved.length > 0) {
    console.error(`Error: ${unresolved.length} unresolved token ref(s):`);
    unresolved.slice(0, 40).forEach((line) => console.error(`  ${line}`));
    process.exit(1);
  }

  const uRoot = unwrap(resolved);
  const uRootConverted = convertPxToRemDeep(uRoot);
  const uBase = uRootConverted.base;
  const uColor = uRootConverted.color;
  const uSize = uRootConverted.size;
  const uShadows = uRootConverted.shadows;

  const scale = uBase?.color?.scale;
  const base = isPlain(scale) ? themeBaseFromUnwrappedScale(scale) : {};

  const btn = uColor?.button?.primary;
  if (!isPlain(btn) || !isPlain(btn.bgColor)) {
    console.error("Expected resolved color.button.primary with bgColor, borderColor, fgColor");
    process.exit(1);
  }

  const buttonPrimary = {
    bgColor: btn.bgColor,
    borderColor: btn.borderColor,
    fgColor: btn.fgColor,
  };

  const btnSecondary = uColor?.button?.secondary;
  if (!isPlain(btnSecondary) || !isPlain(btnSecondary.bgColor)) {
    console.error("Expected resolved color.button.secondary with bgColor, borderColor, fgColor");
    process.exit(1);
  }

  const buttonSecondary = {
    bgColor: btnSecondary.bgColor,
    borderColor: btnSecondary.borderColor,
    fgColor: btnSecondary.fgColor,
  };

  const btnDanger = uColor?.button?.danger;
  if (!isPlain(btnDanger) || !isPlain(btnDanger.bgColor)) {
    console.error("Expected resolved color.button.danger with bgColor, borderColor, fgColor");
    process.exit(1);
  }

  const buttonDanger = {
    bgColor: btnDanger.bgColor,
    borderColor: btnDanger.borderColor,
    fgColor: btnDanger.fgColor,
  };

  const btnRounded = uColor?.button?.rounded;
  if (!isPlain(btnRounded) || !isPlain(btnRounded.bgColor)) {
    console.error("Expected resolved color.button.rounded with bgColor, borderColor, fgColor");
    process.exit(1);
  }

  const buttonRounded = {
    bgColor: btnRounded.bgColor,
    borderColor: btnRounded.borderColor,
    fgColor: btnRounded.fgColor,
  };

  const btnGhost = uColor?.button?.ghost;
  if (!isPlain(btnGhost) || !isPlain(btnGhost.bgColor)) {
    console.error("Expected resolved color.button.ghost with bgColor, borderColor, fgColor");
    process.exit(1);
  }

  const buttonGhost = {
    bgColor: btnGhost.bgColor,
    borderColor: btnGhost.borderColor,
    fgColor: btnGhost.fgColor,
  };

  const pillSurfaces = ["filled", "bordered"];
  const pillLayers = ["bgColor", "borderColor", "fgColor"];
  const validatePillSurface = (block, label) => {
    if (!isPlain(block)) {
      console.error(`Expected ${label}`);
      process.exit(1);
    }
    for (const layer of pillLayers) {
      if (typeof block[layer] !== "string") {
        console.error(`Expected ${label}.${layer} to be a string`);
        process.exit(1);
      }
    }
  };

  const pillRoot = uColor?.pill;
  if (!isPlain(pillRoot)) {
    console.error(
      "Expected resolved color.pill (tokens/functional/components/pill/*.json — shade → intensity → filled|bordered)"
    );
    process.exit(1);
  }

  /**
   * Pattern: color.pill.<shade>.<intensity>.<filled|bordered>.<bgColor|borderColor|fgColor>
   * Shade files merge under color.pill (e.g. pill/gray.json). Add yellow.json the same way.
   */
  const pillColors = {};
  for (const shade of Object.keys(pillRoot).sort()) {
    const shadeBlock = pillRoot[shade];
    if (!isPlain(shadeBlock)) {
      console.error(`Expected color.pill.${shade} to be an object`);
      process.exit(1);
    }
    pillColors[shade] = {};
    for (const intensity of Object.keys(shadeBlock).sort()) {
      const intensityBlock = shadeBlock[intensity];
      if (!isPlain(intensityBlock)) {
        console.error(`Expected color.pill.${shade}.${intensity} to be an object`);
        process.exit(1);
      }
      pillColors[shade][intensity] = {};
      for (const surface of pillSurfaces) {
        if (!isPlain(intensityBlock[surface])) {
          console.error(`Expected color.pill.${shade}.${intensity}.${surface}`);
          process.exit(1);
        }
        validatePillSurface(
          intensityBlock[surface],
          `color.pill.${shade}.${intensity}.${surface}`
        );
        pillColors[shade][intensity][surface] = {
          bgColor: intensityBlock[surface].bgColor,
          borderColor: intensityBlock[surface].borderColor,
          fgColor: intensityBlock[surface].fgColor,
        };
      }
    }
  }

  const linkStates = ["rest", "hover"];
  const validateLinkFg = (block, label) => {
    if (!isPlain(block?.fgColor)) {
      console.error(`Expected ${label}.fgColor`);
      process.exit(1);
    }
    for (const s of linkStates) {
      if (typeof block.fgColor[s] !== "string") {
        console.error(`Expected ${label}.fgColor.${s} to be a string`);
        process.exit(1);
      }
    }
  };
  const linkInline = uColor?.link?.inline;
  const linkStandalone = uColor?.link?.standalone;
  if (!isPlain(linkInline) || !isPlain(linkStandalone)) {
    console.error("Expected resolved color.link.{inline,standalone} (tokens/functional/components/link/link.json)");
    process.exit(1);
  }
  validateLinkFg(linkInline, "color.link.inline");
  validateLinkFg(linkStandalone, "color.link.standalone");
  const linkColors = {
    inline: linkInline.fgColor,
    standalone: linkStandalone.fgColor,
  };

  const highlightColorRoot = uColor?.highlight;
  if (!isPlain(highlightColorRoot)) {
    console.error(
      "Expected resolved color.highlight (tokens/functional/components/highlight/highlight.json)"
    );
    process.exit(1);
  }
  const highlightShades = Object.keys(highlightColorRoot).sort();
  if (!highlightShades.length) {
    console.error("Expected at least one color.highlight.* stop in highlight.json");
    process.exit(1);
  }
  const highlightColors = {};
  for (const shade of highlightShades) {
    const block = highlightColorRoot[shade];
    if (!isPlain(block) || typeof block.bgColor !== "string" || typeof block.fgColor !== "string") {
      console.error(`Expected color.highlight.${shade}.{bgColor,fgColor} to be strings`);
      process.exit(1);
    }
    highlightColors[shade] = {
      bgColor: block.bgColor,
      fgColor: block.fgColor,
    };
  }

  const breadcrumbLink = uColor?.breadcrumb?.link;
  const breadcrumbSeparator = uColor?.breadcrumb?.separator;
  if (!isPlain(breadcrumbLink) || !isPlain(breadcrumbLink.bgColor) || !isPlain(breadcrumbLink.fgColor)) {
    console.error(
      "Expected resolved color.breadcrumb.link with bgColor, fgColor (tokens/functional/components/breadcrumb/breadcrumb.json)"
    );
    process.exit(1);
  }
  if (!isPlain(breadcrumbSeparator) || typeof breadcrumbSeparator.fgColor !== "string") {
    console.error("Expected resolved color.breadcrumb.separator.fgColor");
    process.exit(1);
  }
  const breadcrumbStates = ["rest", "hover", "active"];
  for (const layer of ["bgColor", "fgColor"]) {
    for (const s of breadcrumbStates) {
      if (typeof breadcrumbLink[layer][s] !== "string") {
        console.error(`Expected color.breadcrumb.link.${layer}.${s} to be a string`);
        process.exit(1);
      }
    }
  }
  const breadcrumbColors = {
    link: breadcrumbLink,
    separator: breadcrumbSeparator,
  };

  const tableHeader = uColor?.table?.header;
  const tableBody = uColor?.table?.body;
  const tableContainer = uColor?.table?.container;
  if (
    !isPlain(tableHeader) ||
    typeof tableHeader.bgColor !== "string" ||
    typeof tableHeader.fgColor !== "string" ||
    typeof tableHeader.borderColor !== "string"
  ) {
    console.error(
      "Expected resolved color.table.header.{bgColor,fgColor,borderColor} (tokens/functional/components/table/table.json)"
    );
    process.exit(1);
  }
  if (
    !isPlain(tableBody) ||
    typeof tableBody.bgColor !== "string" ||
    typeof tableBody.fgColor !== "string" ||
    typeof tableBody.borderColor !== "string"
  ) {
    console.error(
      "Expected resolved color.table.body.{bgColor,fgColor,borderColor} (tokens/functional/components/table/table.json)"
    );
    process.exit(1);
  }
  if (!isPlain(tableContainer) || typeof tableContainer.borderColor !== "string") {
    console.error("Expected resolved color.table.container.borderColor");
    process.exit(1);
  }
  const tableColors = {
    header: tableHeader,
    body: tableBody,
    container: tableContainer,
  };

  const siteHeaderColor = uColor?.siteHeader;
  if (
    !isPlain(siteHeaderColor) ||
    typeof siteHeaderColor.background !== "string" ||
    typeof siteHeaderColor.border !== "string" ||
    typeof siteHeaderColor.divider !== "string"
  ) {
    console.error(
      "Expected resolved color.siteHeader.{background,border,divider} (tokens/functional/components/site-header/site-header.json)"
    );
    process.exit(1);
  }
  const siteHeaderColors = {
    background: siteHeaderColor.background,
    border: siteHeaderColor.border,
    divider: siteHeaderColor.divider,
  };

  const overlayColor = uColor?.overlay;
  if (
    !isPlain(overlayColor) ||
    typeof overlayColor.modal !== "string" ||
    typeof overlayColor.sheet !== "string" ||
    typeof overlayColor.none !== "string"
  ) {
    console.error(
      "Expected resolved color.overlay.{modal,sheet,none} (tokens/functional/components/overlay/overlay.json)"
    );
    process.exit(1);
  }
  const overlayColors = {
    modal: overlayColor.modal,
    sheet: overlayColor.sheet,
    none: overlayColor.none,
  };

  const sheetColor = uColor?.sheet;
  if (!isPlain(sheetColor) || typeof sheetColor.background !== "string") {
    console.error(
      "Expected resolved color.sheet.background (tokens/functional/components/sheet/sheet.json)"
    );
    process.exit(1);
  }
  const sheetColors = {
    background: sheetColor.background,
  };

  const sidebarColor = uColor?.sidebar;
  if (
    !isPlain(sidebarColor) ||
    typeof sidebarColor.background !== "string" ||
    typeof sidebarColor.border !== "string"
  ) {
    console.error(
      "Expected resolved color.sidebar.background and color.sidebar.border (tokens/functional/components/sidebar/sidebar.json)"
    );
    process.exit(1);
  }
  const sidebarColors = {
    background: sidebarColor.background,
    border: sidebarColor.border,
  };

  const popoverColor = uColor?.popover;
  if (!isPlain(popoverColor) || typeof popoverColor.background !== "string") {
    console.error(
      "Expected resolved color.popover.background (tokens/functional/components/popover/popover.json)"
    );
    process.exit(1);
  }
  const popoverColors = {
    background: popoverColor.background,
  };

  const actionMenuColor = uColor?.actionMenu;
  const amItemBg = actionMenuColor?.item?.bgColor;
  const amItemFg = actionMenuColor?.item?.fgColor;
  const amSectionFg = actionMenuColor?.section?.fgColor;
  const amDividerFg = actionMenuColor?.divider?.fgColor;
  const amBgStates = ["rest", "hover", "pressed", "disabled"];
  const amSelectedBgStates = ["rest", "pressed"];
  const amFgStates = ["rest", "pressed", "disabled", "selected", "subtext"];
  if (
    !isPlain(amItemBg) ||
    !amBgStates.every((s) => typeof amItemBg[s] === "string") ||
    !isPlain(amItemBg.selected) ||
    !amSelectedBgStates.every((s) => typeof amItemBg.selected[s] === "string") ||
    !isPlain(amItemFg) ||
    !amFgStates.every((s) => typeof amItemFg[s] === "string") ||
    typeof amSectionFg !== "string" ||
    typeof amDividerFg !== "string"
  ) {
    console.error(
      "Expected resolved color.actionMenu.{item.bgColor,item.fgColor,section.fgColor,divider.fgColor} (tokens/functional/components/action-menu/action-menu.json)"
    );
    process.exit(1);
  }
  const actionMenuColors = {
    item: {
      bgColor: {
        rest: amItemBg.rest,
        hover: amItemBg.hover,
        pressed: amItemBg.pressed,
        disabled: amItemBg.disabled,
        selected: {
          rest: amItemBg.selected.rest,
          pressed: amItemBg.selected.pressed,
        },
      },
      fgColor: {
        rest: amItemFg.rest,
        pressed: amItemFg.pressed,
        disabled: amItemFg.disabled,
        selected: amItemFg.selected,
        subtext: amItemFg.subtext,
      },
    },
    section: { fgColor: amSectionFg },
    divider: { fgColor: amDividerFg },
  };

  const tipColor = uColor?.tooltip;
  if (
    !isPlain(tipColor) ||
    typeof tipColor.background !== "string" ||
    typeof tipColor.border !== "string" ||
    typeof tipColor.foreground !== "string"
  ) {
    console.error(
      "Expected resolved color.tooltip.{background,border,foreground} (from tooltip.color in components/tooltip/tooltip.json)"
    );
    process.exit(1);
  }

  const tooltipColors = {
    background: tipColor.background,
    border: tipColor.border,
    foreground: tipColor.foreground,
  };

  const ib = uColor?.iconButton;
  const ibLayers = ["bgColor", "borderColor", "fgColor"];
  const ibStates = ["rest", "hover", "pressed", "disabled"];
  /** Token keys under each variant; `base` maps to theme/CSS segment `unselected`. */
  const ibTokenModes = ["base", "selected"];
  const validateIconButtonInteractive = (block, label) => {
    if (!isPlain(block)) {
      console.error(`Expected ${label}`);
      process.exit(1);
    }
    for (const layer of ibLayers) {
      if (!isPlain(block[layer])) {
        console.error(`Expected ${label}.${layer}`);
        process.exit(1);
      }
      for (const s of ibStates) {
        if (typeof block[layer][s] !== "string") {
          console.error(`Expected ${label}.${layer}.${s} to be a string`);
          process.exit(1);
        }
      }
    }
  };
  if (!isPlain(ib)) {
    console.error(
      "Expected resolved color.iconButton (merge of tokens/functional/components/icon-button/*.json — one file per variant, like button/)"
    );
    process.exit(1);
  }
  /**
   * Pattern: color.iconButton.<variant>.<base|selected>.<bgColor|borderColor|fgColor>.<rest|hover|pressed|disabled>
   * Variants are any key on `iconButton` (no hardcoded list). Theme + CSS keep `unselected` for the base appearance.
   */
  const iconButton = {};
  for (const variantName of Object.keys(ib)) {
    const v = ib[variantName];
    if (!isPlain(v)) {
      console.error(`Expected color.iconButton.${variantName} to be an object with base and selected`);
      process.exit(1);
    }
    for (const k of Object.keys(v)) {
      if (!ibTokenModes.includes(k)) {
        console.error(
          `Unexpected key color.iconButton.${variantName}.${k} — only ${ibTokenModes.join(", ")} are allowed`
        );
        process.exit(1);
      }
    }
    if (!isPlain(v.base) || !isPlain(v.selected)) {
      console.error(`Expected color.iconButton.${variantName}.base and .selected (each: bgColor, borderColor, fgColor)`);
      process.exit(1);
    }
    validateIconButtonInteractive(v.base, `color.iconButton.${variantName}.base`);
    validateIconButtonInteractive(v.selected, `color.iconButton.${variantName}.selected`);
    iconButton[variantName] = { unselected: v.base, selected: v.selected };
  }

  const globalColors = pickGlobalColors(uColor);
  assertGlobalColorLeaves(globalColors, "globalColors");

  const control = uSize?.size?.control;
  const sizesOk =
    isPlain(control) &&
    isPlain(control.extraSmall) &&
    isPlain(control.small) &&
    isPlain(control.medium) &&
    isPlain(control.large) &&
    isPlain(control.iconButton);
  if (!sizesOk) {
    console.error(
      "Expected resolved size.control.{extraSmall,small,medium,large,iconButton} (from tokens/functional/size/size.json)"
    );
    process.exit(1);
  }

  const pick = (obj, keyPath) => {
    const parts = keyPath.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!isPlain(cur)) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const rawBtn = rawTypography?.button;
  if (
    !isPlain(rawBtn) ||
    !isPlain(rawBtn.extraSmall) ||
    !isPlain(rawBtn.small) ||
    !isPlain(rawBtn.medium) ||
    !isPlain(rawBtn.large)
  ) {
    console.error(
      "Expected raw typography button.{extraSmall,small,medium,large} (from tokens/functional/typography/typography.json)"
    );
    process.exit(1);
  }
  const buttonTypography = {
    extraSmall: {
      fontSize: pxStringToRem(rawBtn.extraSmall.fontSize?.value) ?? "0.6875rem",
      lineHeight: pxStringToRem(rawBtn.extraSmall.lineHeight?.value) ?? "0.875rem",
    },
    small: {
      fontSize: pxStringToRem(rawBtn.small.fontSize?.value) ?? "0.75rem",
      lineHeight: pxStringToRem(rawBtn.small.lineHeight?.value) ?? "1rem",
    },
    medium: {
      fontSize: pxStringToRem(rawBtn.medium.fontSize?.value) ?? "0.875rem",
      lineHeight: pxStringToRem(rawBtn.medium.lineHeight?.value) ?? "1.25rem",
    },
    large: {
      fontSize: pxStringToRem(rawBtn.large.fontSize?.value) ?? "1rem",
      lineHeight: pxStringToRem(rawBtn.large.lineHeight?.value) ?? "1.25rem",
    },
  };

  for (const stop of ["extraSmall", "small", "medium", "large"]) {
    for (const field of ["fontSize", "lineHeight"]) {
      if (typeof buttonTypography[stop][field] !== "string") {
        console.error(`Expected buttonTypography.${stop}.${field} to be a string`);
        process.exit(1);
      }
    }
  }

  const rawPill = rawTypography?.pill;
  if (rawPill !== undefined) {
    console.error(
      "Remove typography.pill from tokens/functional/typography/typography.json — Pill inherits text styles."
    );
    process.exit(1);
  }

  /** Expose resolved functional control sizes on the theme (single source for buttons, inputs, etc.). */
  const controlSizes = {
    extraSmall: {
      size: pick(control.extraSmall, "size"),
      borderRadius: pick(control.extraSmall, "borderRadius"),
      gap: pick(control.extraSmall, "gap"),
      icon: pick(control.extraSmall, "icon"),
      paddingBlock: pick(control.extraSmall, "paddingBlock"),
      paddingInline: {
        condensed: pick(control.extraSmall, "paddingInline.condensed"),
        normal: pick(control.extraSmall, "paddingInline.normal"),
        spacious: pick(control.extraSmall, "paddingInline.spacious"),
      },
    },
    small: {
      size: pick(control.small, "size"),
      borderRadius: pick(control.small, "borderRadius"),
      gap: pick(control.small, "gap"),
      icon: pick(control.small, "icon"),
      paddingBlock: pick(control.small, "paddingBlock"),
      paddingInline: {
        condensed: pick(control.small, "paddingInline.condensed"),
        normal: pick(control.small, "paddingInline.normal"),
        spacious: pick(control.small, "paddingInline.spacious"),
      },
    },
    medium: {
      size: pick(control.medium, "size"),
      borderRadius: pick(control.medium, "borderRadius"),
      gap: pick(control.medium, "gap"),
      icon: pick(control.medium, "icon"),
      paddingBlock: pick(control.medium, "paddingBlock"),
      paddingInline: {
        condensed: pick(control.medium, "paddingInline.condensed"),
        normal: pick(control.medium, "paddingInline.normal"),
        spacious: pick(control.medium, "paddingInline.spacious"),
      },
    },
    large: {
      size: pick(control.large, "size"),
      borderRadius: pick(control.large, "borderRadius"),
      gap: pick(control.large, "gap"),
      icon: pick(control.large, "icon"),
      paddingBlock: pick(control.large, "paddingBlock"),
      paddingInline: {
        condensed: pick(control.large, "paddingInline.condensed"),
        normal: pick(control.large, "paddingInline.normal"),
        spacious: pick(control.large, "paddingInline.spacious"),
      },
    },
  };

  for (const stop of ["extraSmall", "small", "medium", "large"]) {
    const c = controlSizes[stop];
    for (const field of ["size", "borderRadius", "gap", "icon", "paddingBlock"]) {
      if (typeof c[field] !== "string") {
        console.error(`Expected controlSizes.${stop}.${field} to be a string`);
        process.exit(1);
      }
    }
    for (const k of ["condensed", "normal", "spacious"]) {
      if (typeof c.paddingInline[k] !== "string") {
        console.error(`Expected controlSizes.${stop}.paddingInline.${k} to be a string`);
        process.exit(1);
      }
    }
  }

  // Map functional size border tokens → ThemeTokens.sizes.borderRadius/borderWidth
  const br = uSize?.borderRadius;
  const bw = uSize?.borderWidth;
  if (!isPlain(br) || !isPlain(bw)) {
    console.error(
      "Expected resolved size.borderRadius and size.borderWidth (from tokens/functional/size/border.json)"
    );
    process.exit(1);
  }
  const borderRadius = {
    sm: br.small,
    md: br.medium,
    lg: br.large,
    xl: br.xlarge,
    full: br.full,
  };
  const borderWidth = {
    thin: bw.thin,
    thick: bw.thick,
  };
  for (const [k, v] of Object.entries(borderRadius)) {
    if (typeof v !== "string") {
      console.error(`Expected borderRadius.${k} to be a string`);
      process.exit(1);
    }
  }
  for (const [k, v] of Object.entries(borderWidth)) {
    if (typeof v !== "string") {
      console.error(`Expected borderWidth.${k} to be a string`);
      process.exit(1);
    }
  }

  const breakpointSrc = uSize?.breakpoint;
  if (
    !isPlain(breakpointSrc) ||
    typeof breakpointSrc.md !== "string" ||
    typeof breakpointSrc.lg !== "string"
  ) {
    console.error(
      "Expected resolved size.breakpoint.{md,lg} (from tokens/functional/size/breakpoints.json)"
    );
    process.exit(1);
  }
  const breakpoints = {
    md: breakpointSrc.md,
    lg: breakpointSrc.lg,
  };

  const spaceScaleRaw = uSize?.space;
  if (!isPlain(spaceScaleRaw)) {
    console.error("Expected resolved size.space (from tokens/functional/size/space.json)");
    process.exit(1);
  }

  const spacePxKeys = Object.keys(spaceScaleRaw)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));

  if (!spacePxKeys.length || typeof spaceScaleRaw["8"] !== "string") {
    console.error("Expected size.space.8 (8px base) in space.json");
    process.exit(1);
  }

  const space = Object.fromEntries(
    spacePxKeys.map((k) => {
      if (typeof spaceScaleRaw[k] !== "string") {
        console.error(`Expected size.space.${k} to be a string`);
        process.exit(1);
      }
      return [k, spaceScaleRaw[k]];
    }),
  );

  const spaceScale = buildSpaceScaleFromPxSpace(space);

  if (typeof spaceScale["1x"] !== "string") {
    console.error("Expected 8pt spaceScale.1x from size.space.8");
    process.exit(1);
  }

  const stackScaleKeys = ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

  function readStackScale(src, label) {
    if (!isPlain(src) || !stackScaleKeys.every((k) => typeof src[k] === "string")) {
      console.error(
        `Expected resolved size.stack.${label}.{${stackScaleKeys.join(",")}} (from tokens/functional/size/stack.json)`
      );
      process.exit(1);
    }
    return Object.fromEntries(stackScaleKeys.map((k) => [k, src[k]]));
  }

  const stackGap = readStackScale(uSize?.stack?.gap, "gap");
  const stackPadding = readStackScale(uSize?.stack?.padding, "padding");

  const layoutLayoutKeys = [
    "pageMaxWidth",
    "contentMaxWidth",
    "sectionLabelWidth",
    "pagePaddingInline",
  ];
  const layoutLayoutSrc = uSize?.layout;
  if (!isPlain(layoutLayoutSrc)) {
    console.error(
      "Expected resolved size.layout.* (from tokens/functional/size/layout.json)"
    );
    process.exit(1);
  }
  const layoutSizes = {};
  for (const key of layoutLayoutKeys) {
    if (typeof layoutLayoutSrc[key] !== "string") {
      console.error(`Expected size.layout.${key} to be a string`);
      process.exit(1);
    }
    layoutSizes[key] = layoutLayoutSrc[key];
  }

  const containerLayoutKeys = [
    "panelMinWidth",
    "sheetWidthSm",
    "sheetWidthMd",
    "sheetWidthLg",
    "sidebarWidthSm",
    "sidebarWidthMd",
    "sidebarWidthLg",
    "sidebarMinWidth",
    "sidebarMaxWidth",
    "tooltipMaxWidth",
    "tooltipMaxWidthSingleLine",
    "popoverMinWidth",
    "popoverMaxWidth",
  ];
  const containerLayoutSrc = uSize?.container;
  if (!isPlain(containerLayoutSrc)) {
    console.error(
      "Expected resolved size.container.* (from tokens/functional/size/container.json)"
    );
    process.exit(1);
  }
  const containerSizes = {};
  for (const key of containerLayoutKeys) {
    if (typeof containerLayoutSrc[key] !== "string") {
      console.error(`Expected size.container.${key} to be a string`);
      process.exit(1);
    }
    containerSizes[key] = containerLayoutSrc[key];
  }

  const highlightLayoutSrc = uSize?.highlight;
  if (!isPlain(highlightLayoutSrc)) {
    console.error(
      "Expected resolved size.highlight.* (from tokens/functional/size/highlight.json)"
    );
    process.exit(1);
  }
  const highlightLayoutKeys = ["paddingInline", "paddingBlock", "borderRadius"];
  const highlightSizes = {};
  for (const key of highlightLayoutKeys) {
    if (typeof highlightLayoutSrc[key] !== "string") {
      console.error(`Expected size.highlight.${key} to be a string`);
      process.exit(1);
    }
    highlightSizes[key] = highlightLayoutSrc[key];
  }

  const tipLayout = uSize?.tooltip;
  if (!isPlain(tipLayout)) {
    console.error(
      "Expected resolved size.tooltip.* (from tooltip.sizes in components/tooltip/tooltip.json)"
    );
    process.exit(1);
  }
  const tooltipLayout = {
    gap: tipLayout.gap,
    borderRadius: tipLayout.borderRadius,
    paddingInline: tipLayout.paddingInline,
    paddingBlock: tipLayout.paddingBlock,
    maxWidth: tipLayout.maxWidth,
    maxWidthSingleLine: tipLayout.maxWidthSingleLine,
    boxShadow: tipLayout.boxShadow,
  };
  for (const [k, v] of Object.entries(tooltipLayout)) {
    if (typeof v !== "string") {
      console.error(`Expected tooltipLayout.${k} to be a string`);
      process.exit(1);
    }
  }

  const pillLayoutSrc = uSize?.pill;
  if (!isPlain(pillLayoutSrc)) {
    console.error("Expected resolved size.pill.* (from pill.sizes in components/pill/pill.json)");
    process.exit(1);
  }
  const pillSizes = {};
  for (const k of ["paddingInline", "paddingBlock", "borderRadius", "gap", "height"]) {
    if (typeof pillLayoutSrc[k] !== "string") {
      console.error(`Expected size.pill.${k} to be a string`);
      process.exit(1);
    }
    pillSizes[k] = pillLayoutSrc[k];
  }

  const iconRoot = uSize?.icon;
  if (!isPlain(iconRoot)) {
    console.error("Expected resolved size.icon.{xs,sm,md,lg} (from tokens/functional/size/icon.json)");
    process.exit(1);
  }
  const iconStops = ["xs", "sm", "md", "lg"];
  const iconSizes = {};
  for (const stop of iconStops) {
    if (typeof iconRoot[stop] !== "string") {
      console.error(`Expected size.icon.${stop} to be a string`);
      process.exit(1);
    }
    iconSizes[stop] = iconRoot[stop];
  }

  const ibSize = control.iconButton;
  const ibSizeStops = ["extraSmall", "small", "medium", "large"];
  const iconButtonSizes = {};
  for (const stop of ibSizeStops) {
    const row = ibSize[stop];
    if (!isPlain(row)) {
      console.error(`Expected size.control.iconButton.${stop} (tokens/functional/size/size.json)`);
      process.exit(1);
    }
    for (const k of ["size", "borderRadius", "icon"]) {
      if (typeof row[k] !== "string") {
        console.error(`Expected size.control.iconButton.${stop}.${k} to be a string`);
        process.exit(1);
      }
    }
    iconButtonSizes[stop] = { size: row.size, borderRadius: row.borderRadius, icon: row.icon };
  }

  const breadcrumbLayoutSrc = uSize?.breadcrumb;
  if (!isPlain(breadcrumbLayoutSrc)) {
    console.error(
      "Expected resolved size.breadcrumb.* (from breadcrumb.sizes in components/breadcrumb/breadcrumb.json)"
    );
    process.exit(1);
  }
  const breadcrumbLayoutKeys = [
    "gap",
    "itemPaddingInline",
    "itemPaddingBlock",
    "itemBorderRadius",
    "separatorWidth",
  ];
  const breadcrumbSizes = {};
  for (const key of breadcrumbLayoutKeys) {
    if (typeof breadcrumbLayoutSrc[key] !== "string") {
      console.error(`Expected size.breadcrumb.${key} to be a string`);
      process.exit(1);
    }
    breadcrumbSizes[key] = breadcrumbLayoutSrc[key];
  }

  const tableLayoutSrc = uSize?.table;
  if (!isPlain(tableLayoutSrc)) {
    console.error(
      "Expected resolved size.table.* (from table.sizes in components/table/table.json)"
    );
    process.exit(1);
  }
  if (typeof tableLayoutSrc.borderRadius !== "string") {
    console.error("Expected size.table.borderRadius to be a string");
    process.exit(1);
  }
  const tableDensityKeys = ["cellPaddingInline", "cellPaddingBlock", "rowHeight"];
  const pickTableDensity = (block, label) => {
    if (!isPlain(block)) {
      console.error(`Expected size.table.density.${label}`);
      process.exit(1);
    }
    const out = {};
    for (const key of tableDensityKeys) {
      if (typeof block[key] !== "string") {
        console.error(`Expected size.table.density.${label}.${key} to be a string`);
        process.exit(1);
      }
      out[key] = block[key];
    }
    return out;
  };
  const tableSizes = {
    borderRadius: tableLayoutSrc.borderRadius,
    density: {
      dense: pickTableDensity(tableLayoutSrc.density?.dense, "dense"),
      spacious: pickTableDensity(tableLayoutSrc.density?.spacious, "spacious"),
    },
  };

  const siteHeaderLayoutSrc = uSize?.siteHeader;
  if (!isPlain(siteHeaderLayoutSrc)) {
    console.error(
      "Expected resolved size.siteHeader.* (from siteHeader.sizes in components/site-header/site-header.json)"
    );
    process.exit(1);
  }
  const siteHeaderLayoutKeys = [
    "height",
    "paddingInlineStart",
    "paddingInlineEnd",
    "paddingBlock",
    "leadingGap",
    "trailingGap",
    "dividerHeight",
    "dividerWidth",
  ];
  const siteHeaderSizes = {};
  for (const key of siteHeaderLayoutKeys) {
    if (typeof siteHeaderLayoutSrc[key] !== "string") {
      console.error(`Expected size.siteHeader.${key} to be a string`);
      process.exit(1);
    }
    siteHeaderSizes[key] = siteHeaderLayoutSrc[key];
  }

  const zIndexKeys = [
    "base",
    "raised",
    "sticky",
    "dropdown",
    "overlay",
    "sheet",
    "dialog",
    "popover",
    "tooltip",
    "toast",
    "max",
  ];
  const zIndexSrc = uSize?.zIndex;
  if (!isPlain(zIndexSrc) || !zIndexKeys.every((k) => typeof zIndexSrc[k] === "string")) {
    console.error(
      `Expected resolved size.zIndex.{${zIndexKeys.join(",")}} (from tokens/functional/size/z-index.json)`
    );
    process.exit(1);
  }
  const zIndex = Object.fromEntries(zIndexKeys.map((k) => [k, zIndexSrc[k]]));

  const sheetLayoutSrc = uSize?.sheet;
  if (!isPlain(sheetLayoutSrc)) {
    console.error("Expected resolved size.sheet.* (from sheet.sizes in components/sheet/sheet.json)");
    process.exit(1);
  }
  const sheetWidthSrc = sheetLayoutSrc.width;
  const sheetWidthStops = ["sm", "md", "lg"];
  if (
    !isPlain(sheetWidthSrc) ||
    !sheetWidthStops.every((k) => typeof sheetWidthSrc[k] === "string")
  ) {
    console.error(
      `Expected resolved size.sheet.width.{${sheetWidthStops.join(",")}} (from sheet.json)`
    );
    process.exit(1);
  }
  const sheetScalarKeys = ["minWidth", "maxWidth", "maxHeight", "padding", "bottomCornerRadius"];
  const sheetSizes = {
    width: Object.fromEntries(sheetWidthStops.map((k) => [k, sheetWidthSrc[k]])),
  };
  for (const key of sheetScalarKeys) {
    if (typeof sheetLayoutSrc[key] !== "string") {
      console.error(`Expected size.sheet.${key} to be a string`);
      process.exit(1);
    }
    sheetSizes[key] = sheetLayoutSrc[key];
  }

  const sidebarLayoutSrc = uSize?.sidebar;
  if (!isPlain(sidebarLayoutSrc)) {
    console.error("Expected resolved size.sidebar.* (from sidebar.sizes in components/sidebar/sidebar.json)");
    process.exit(1);
  }
  const sidebarWidthSrc = sidebarLayoutSrc.width;
  const sidebarWidthStops = ["sm", "md", "lg"];
  if (
    !isPlain(sidebarWidthSrc) ||
    !sidebarWidthStops.every((k) => typeof sidebarWidthSrc[k] === "string")
  ) {
    console.error(
      `Expected resolved size.sidebar.width.{${sidebarWidthStops.join(",")}} (from sidebar.json)`
    );
    process.exit(1);
  }
  const sidebarScalarKeys = ["widthMinimized", "minWidth", "maxWidth", "padding", "footerPadding"];
  const sidebarSizes = {
    width: Object.fromEntries(sidebarWidthStops.map((k) => [k, sidebarWidthSrc[k]])),
  };
  for (const key of sidebarScalarKeys) {
    if (typeof sidebarLayoutSrc[key] !== "string") {
      console.error(`Expected size.sidebar.${key} to be a string`);
      process.exit(1);
    }
    sidebarSizes[key] = sidebarLayoutSrc[key];
  }

  const resizeHandleSrc = uSize?.resizeHandle;
  if (!isPlain(resizeHandleSrc) || typeof resizeHandleSrc.hitArea !== "string") {
    console.error(
      "Expected resolved size.resizeHandle.hitArea (from tokens/functional/size/resize-handle.json)"
    );
    process.exit(1);
  }
  const resizeHandleSizes = {
    hitArea: resizeHandleSrc.hitArea,
  };

  const focusRingSrc = uSize?.focusRing;
  if (!isPlain(focusRingSrc)) {
    console.error(
      "Expected resolved size.focusRing.{width,offset} (from tokens/functional/size/outline.json)"
    );
    process.exit(1);
  }
  const focusRing = {
    width:
      typeof focusRingSrc.width === "number"
        ? `${focusRingSrc.width}px`
        : focusRingSrc.width,
    offset:
      typeof focusRingSrc.offset === "number"
        ? `${focusRingSrc.offset}px`
        : focusRingSrc.offset,
  };
  if (typeof focusRing.width !== "string" || typeof focusRing.offset !== "string") {
    console.error("Expected size.focusRing.width and size.focusRing.offset to be px numbers or strings");
    process.exit(1);
  }

  const popoverLayoutSrc = uSize?.popover;
  if (!isPlain(popoverLayoutSrc)) {
    console.error(
      "Expected resolved size.popover.* (from popover.sizes in components/popover/popover.json)"
    );
    process.exit(1);
  }
  const popoverLayoutKeys = ["gap", "borderRadius", "minWidth", "maxWidth"];
  const popoverLayout = {};
  for (const key of popoverLayoutKeys) {
    if (typeof popoverLayoutSrc[key] !== "string") {
      console.error(`Expected size.popover.${key} to be a string`);
      process.exit(1);
    }
    popoverLayout[key] = popoverLayoutSrc[key];
  }

  const actionMenuLayoutSrc = uSize?.actionMenu;
  if (!isPlain(actionMenuLayoutSrc)) {
    console.error(
      "Expected resolved size.actionMenu.* (from action-menu.sizes in components/action-menu/action-menu.json)"
    );
    process.exit(1);
  }
  const actionMenuItemKeys = [
    "minHeight",
    "paddingInline",
    "paddingBlock",
    "borderRadius",
    "slotGap",
    "subtextGap",
    "iconSize",
    "subtextIconSize",
  ];
  const actionMenuListKeys = ["paddingInline", "paddingBlock", "itemGap", "sectionGap"];
  const actionMenuSectionKeys = ["paddingInline", "paddingBlock"];
  const actionMenuHeaderKeys = ["paddingInline", "paddingBlockStart", "paddingBlockEnd"];
  const actionMenuFooterKeys = ["padding"];
  const pickLayoutBlock = (block, keys, label) => {
    if (!isPlain(block)) {
      console.error(`Expected ${label}`);
      process.exit(1);
    }
    const out = {};
    for (const key of keys) {
      if (typeof block[key] !== "string") {
        console.error(`Expected ${label}.${key} to be a string`);
        process.exit(1);
      }
      out[key] = block[key];
    }
    return out;
  };
  const actionMenuSizes = {
    item: pickLayoutBlock(actionMenuLayoutSrc.item, actionMenuItemKeys, "size.actionMenu.item"),
    list: pickLayoutBlock(actionMenuLayoutSrc.list, actionMenuListKeys, "size.actionMenu.list"),
    section: pickLayoutBlock(
      actionMenuLayoutSrc.section,
      actionMenuSectionKeys,
      "size.actionMenu.section"
    ),
    header: pickLayoutBlock(
      actionMenuLayoutSrc.header,
      actionMenuHeaderKeys,
      "size.actionMenu.header"
    ),
    footer: pickLayoutBlock(actionMenuLayoutSrc.footer, actionMenuFooterKeys, "size.actionMenu.footer"),
  };

  const shadowKeys = ["popover", "popoverElevated", "sheet", "tooltip"];
  if (!isPlain(uShadows) || !shadowKeys.every((k) => typeof uShadows[k] === "string")) {
    console.error(
      `Expected resolved shadows.{${shadowKeys.join(",")}} (from tokens/functional/shadows/shadows.json)`
    );
    process.exit(1);
  }
  const shadows = Object.fromEntries(shadowKeys.map((k) => [k, uShadows[k]]));

  const typography = {
    ...uRootConverted.typography,
    button: buttonTypography,
  };

  const payload = {
    typography,
    sizes: {
      space,
      spaceScale,
      stack: { gap: stackGap, padding: stackPadding },
      layout: layoutSizes,
      container: containerSizes,
      highlight: highlightSizes,
      borderRadius,
      borderWidth,
      breakpoints,
      control: controlSizes,
      tooltip: tooltipLayout,
      pill: pillSizes,
      icon: iconSizes,
      iconButton: iconButtonSizes,
      breadcrumb: breadcrumbSizes,
      table: tableSizes,
      siteHeader: siteHeaderSizes,
      sheet: sheetSizes,
      sidebar: sidebarSizes,
      popover: popoverLayout,
      actionMenu: actionMenuSizes,
      resizeHandle: resizeHandleSizes,
      focusRing,
      zIndex,
    },
    buttonPrimary,
    buttonSecondary,
    buttonGhost,
    buttonDanger,
    buttonRounded,
    linkColors,
    highlightColors,
    pillColors,
    tooltipColors,
    iconButton,
    breadcrumbColors,
    tableColors,
    siteHeaderColors,
    overlayColors,
    sheetColors,
    sidebarColors,
    popoverColors,
    actionMenuColors,
    shadows,
    globalColors,
  };

  const componentColorKeys = [
    "buttonPrimary",
    "buttonSecondary",
    "buttonGhost",
    "buttonDanger",
    "buttonRounded",
    "linkColors",
    "highlightColors",
    "pillColors",
    "tooltipColors",
    "iconButton",
    "breadcrumbColors",
    "tableColors",
    "siteHeaderColors",
    "overlayColors",
    "sheetColors",
    "sidebarColors",
    "popoverColors",
    "actionMenuColors",
  ];

  const foundationSizeKeys = [
    "space",
    "spaceScale",
    "stack",
    "layout",
    "container",
    "borderRadius",
    "borderWidth",
    "breakpoints",
    "zIndex",
    "focusRing",
  ];

  const componentSizeKeys = [
    "highlight",
    "control",
    "tooltip",
    "pill",
    "icon",
    "iconButton",
    "breadcrumb",
    "table",
    "siteHeader",
    "sheet",
    "sidebar",
    "popover",
    "actionMenu",
    "resizeHandle",
  ];

  const tokenOutput = {
    ...Object.fromEntries(componentColorKeys.map((k) => [k, payload[k]])),
    sizes: Object.fromEntries(componentSizeKeys.map((k) => [k, payload.sizes[k]])),
  };

  const foundation = {
    typography: payload.typography,
    sizes: Object.fromEntries(foundationSizeKeys.map((k) => [k, payload.sizes[k]])),
    globalColors: payload.globalColors,
    shadows: payload.shadows,
  };

  fs.mkdirSync(themeOutputDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(foundation, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
  fs.writeFileSync(tokenOutPath, JSON.stringify(tokenOutput, null, 2) + "\n", "utf8");
  console.log(`Wrote ${tokenOutPath}`);

  // Base scales live in a sibling file so theme.json stays smaller (foundation only).
  fs.writeFileSync(baseOutPath, JSON.stringify(base, null, 2) + "\n", "utf8");
  console.log(`Wrote ${baseOutPath}`);
}

main();
