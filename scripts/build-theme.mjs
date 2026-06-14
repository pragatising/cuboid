#!/usr/bin/env node
/**
 * Merge tokens/base/light.json, tokens/functional/colors/globals.json,
 * and every .json file under tokens/functional/components/ (recursive); resolve
 * {token.path} refs; write src/theme/output/theme.json (+ base scales in output/base.json).
 *
 * Usage: node scripts/build-theme.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
  const themeOutputDir = path.join(ROOT, "src/theme/output");
  const outPath = path.join(themeOutputDir, "theme.json");
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
    if (isPlain(doc.siteHeader)) {
      if (isPlain(doc.siteHeader.color)) {
        mergedColor = deepMerge(mergedColor, { siteHeader: doc.siteHeader.color });
      }
      if (isPlain(doc.siteHeader.sizes)) {
        componentLayoutMerge = deepMerge(componentLayoutMerge, { siteHeader: doc.siteHeader.sizes });
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

  const root = {
    base: light.base,
    color: mergedColor,
    size: functionalSize,
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
  const pillStates = ["rest", "hover", "pressed", "disabled"];
  const pillLayers = ["bgColor", "borderColor", "fgColor"];
  const validatePillInteractive = (block, label) => {
    if (!isPlain(block)) {
      console.error(`Expected ${label}`);
      process.exit(1);
    }
    for (const layer of pillLayers) {
      if (!isPlain(block[layer])) {
        console.error(`Expected ${label}.${layer}`);
        process.exit(1);
      }
      for (const s of pillStates) {
        if (typeof block[layer][s] !== "string") {
          console.error(`Expected ${label}.${layer}.${s} to be a string`);
          process.exit(1);
        }
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
   * Pattern: color.pill.<shade>.<intensity>.<filled|bordered>.<bgColor|borderColor|fgColor>.<rest|hover|pressed|disabled>
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
        validatePillInteractive(
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

  // Alias-map tokens: color.bg / color.fg / color.border → ThemeTokens.colors.functional.*
  const bg = uColor?.bg?.gray;
  const fg = uColor?.fg;
  const brd = uColor?.border;
  const canvas = uColor?.canvas;
  const text = uColor?.text;
  if (!isPlain(bg) || !isPlain(fg) || !isPlain(brd) || !isPlain(canvas)) {
    console.error("Expected resolved color.bg / color.fg / color.border / color.canvas in globals.json");
    process.exit(1);
  }

  const background = {
    default: uColor.bg.gray.light["01"],
    muted: uColor.bg.gray.light["02"],
    inset: uColor.canvas.inset,
    emphasis: uColor.bg.gray.dark["07"],
    disabled: uColor.bg.gray.light["03"],
    transparent: "transparent",
    inverse: uColor.bg.gray.dark["07"],
    neutral: {
      muted: uColor.bg.gray.light["04"],
      emphasis: uColor.bg.gray.dark["05"],
    },
  };

  const foreground = {
    default: uColor.fg.neutral["6"],
    muted: text?.default ?? uColor.fg.neutral["4"],
    onEmphasis: uColor.fg.neutral["1"],
    disabled: text?.disabled ?? uColor.fg.neutral["3"],
    link: uColor.fg.link.default,
    white: uColor.fg.neutral["1"],
    neutral: uColor.fg.neutral["5"],
  };

  const border = {
    default: uColor.border.gray["2"],
    muted: uColor.border.grayAlpha["2"],
    emphasis: uColor.border.gray["3"],
    disabled: uColor.border.gray["1"],
    transparent: "transparent",
    translucent: uColor.border.grayAlpha["1"],
    neutral: {
      muted: uColor.border.gray["1"],
      emphasis: uColor.border.gray["3"],
    },
  };

  const syntax = uColor?.syntax;
  if (!isPlain(syntax)) {
    console.error("Expected resolved color.syntax in globals.json");
    process.exit(1);
  }

  for (const [k, v] of Object.entries(background)) {
    if (k === "neutral") continue;
    if (typeof v !== "string") {
      console.error(`Expected background.${k} to be a string`);
      process.exit(1);
    }
  }
  for (const [k, v] of Object.entries(background.neutral)) {
    if (typeof v !== "string") {
      console.error(`Expected background.neutral.${k} to be a string`);
      process.exit(1);
    }
  }
  for (const [k, v] of Object.entries(foreground)) {
    if (typeof v !== "string") {
      console.error(`Expected foreground.${k} to be a string`);
      process.exit(1);
    }
  }
  for (const [k, v] of Object.entries(border)) {
    if (k === "neutral") continue;
    if (typeof v !== "string") {
      console.error(`Expected border.${k} to be a string`);
      process.exit(1);
    }
  }
  for (const [k, v] of Object.entries(border.neutral)) {
    if (typeof v !== "string") {
      console.error(`Expected border.neutral.${k} to be a string`);
      process.exit(1);
    }
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
  if (!isPlain(rawPill) || !isPlain(rawPill.sm) || !isPlain(rawPill.md)) {
    console.error(
      "Expected raw typography pill.{sm,md} (from tokens/functional/typography/typography.json)"
    );
    process.exit(1);
  }
  const pillTypography = {
    sm: {
      fontSize: pxStringToRem(rawPill.sm.fontSize?.value) ?? "0.75rem",
      lineHeight: pxStringToRem(rawPill.sm.lineHeight?.value) ?? "0.9375rem",
      fontWeight: rawPill.sm.weight?.value ?? 400,
    },
    md: {
      fontSize: pxStringToRem(rawPill.md.fontSize?.value) ?? "0.75rem",
      lineHeight: pxStringToRem(rawPill.md.lineHeight?.value) ?? "1.125rem",
      fontWeight: rawPill.md.weight?.value ?? 400,
    },
  };

  for (const stop of ["sm", "md"]) {
    for (const field of ["fontSize", "lineHeight"]) {
      if (typeof pillTypography[stop][field] !== "string") {
        console.error(`Expected pillTypography.${stop}.${field} to be a string`);
        process.exit(1);
      }
    }
    if (typeof pillTypography[stop].fontWeight !== "number") {
      console.error(`Expected pillTypography.${stop}.fontWeight to be a number`);
      process.exit(1);
    }
  }

  /** Expose resolved functional control sizes on the theme (single source for buttons, inputs, etc.). */
  const controlSizes = {
    extraSmall: {
      size: pick(control.extraSmall, "size"),
      borderRadius: pick(control.extraSmall, "borderRadius"),
      gap: pick(control.extraSmall, "gap"),
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
    for (const field of ["size", "borderRadius", "gap", "paddingBlock"]) {
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

  const spaceScale = uSize?.space;
  const spaceKeys = ["1", "2", "3", "4", "5", "6", "8", "10", "12"];
  if (!isPlain(spaceScale) || !spaceKeys.every((k) => typeof spaceScale[k] === "string")) {
    console.error(
      `Expected resolved size.space.{${spaceKeys.join(",")}} (from tokens/functional/size/space.json)`
    );
    process.exit(1);
  }
  const space = Object.fromEntries(spaceKeys.map((k) => [k, spaceScale[k]]));

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
  const pillSizeKeys = ["sm", "md"];
  const pillSizes = {};
  for (const key of pillSizeKeys) {
    const row = pillLayoutSrc[key];
    if (!isPlain(row)) {
      console.error(`Expected size.pill.${key}`);
      process.exit(1);
    }
    for (const k of ["paddingInline", "paddingBlock", "borderRadius", "gap"]) {
      if (typeof row[k] !== "string") {
        console.error(`Expected size.pill.${key}.${k} to be a string`);
        process.exit(1);
      }
    }
    pillSizes[key] = {
      paddingInline: row.paddingInline,
      paddingBlock: row.paddingBlock,
      borderRadius: row.borderRadius,
      gap: row.gap,
    };
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

  const typography = {
    ...uRootConverted.typography,
    button: buttonTypography,
    pill: pillTypography,
  };

  const payload = {
    typography,
    colors: {
      functional: {
        background,
        foreground,
        border,
        syntax,
      },
    },
    sizes: {
      space,
      stack: { gap: stackGap, padding: stackPadding },
      borderRadius,
      borderWidth,
      breakpoints,
      control: controlSizes,
      tooltip: tooltipLayout,
      pill: pillSizes,
      iconButton: iconButtonSizes,
      breadcrumb: breadcrumbSizes,
      siteHeader: siteHeaderSizes,
    },
    buttonPrimary,
    buttonSecondary,
    buttonGhost,
    buttonDanger,
    buttonRounded,
    linkColors,
    pillColors,
    tooltipColors,
    iconButton,
    breadcrumbColors,
    siteHeaderColors,
    globalColors,
  };

  fs.mkdirSync(themeOutputDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);

  // Base scales live in a sibling file so theme.json stays smaller (functional + layout only).
  fs.writeFileSync(baseOutPath, JSON.stringify(base, null, 2) + "\n", "utf8");
  console.log(`Wrote ${baseOutPath}`);
}

main();
