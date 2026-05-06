#!/usr/bin/env node
/**
 * Merge tokens/base/light.json, tokens/functional/colors/globals.json,
 * and all tokens/functional/components/**.tokens.json files; resolve
 * {token.path} refs; write src/theme/defaultTheme.generated.json.
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

/** Collapse { value: "x" } leaves to plain strings (and recurse). */
function unwrap(node) {
  if (!isPlain(node)) return node;
  if (
    Object.keys(node).length === 1 &&
    typeof node.value === "string" &&
    !node.value.startsWith("{")
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
    else if (ent.name.endsWith(".tokens.json")) acc.push(p);
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

function main() {
  const lightPath = path.join(ROOT, "tokens/base/light.json");
  const baseSizePath = path.join(ROOT, "tokens/base/size.json");
  const globalsPath = path.join(ROOT, "tokens/functional/colors/globals.json");
  const componentsDir = path.join(ROOT, "tokens/functional/components");
  const functionalSizeDir = path.join(ROOT, "tokens/functional/size");
  const outPath = path.join(ROOT, "src/theme/defaultTheme.generated.json");

  if (!fs.existsSync(lightPath)) {
    console.error(`Missing ${lightPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(globalsPath)) {
    console.error(`Missing ${globalsPath}`);
    process.exit(1);
  }

  const light = JSON.parse(fs.readFileSync(lightPath, "utf8"));
  const baseSize = fs.existsSync(baseSizePath)
    ? JSON.parse(fs.readFileSync(baseSizePath, "utf8"))
    : null;
  const globals = JSON.parse(fs.readFileSync(globalsPath, "utf8"));

  if (!isPlain(light.base)) {
    console.error("light.json: expected top-level base");
    process.exit(1);
  }
  if (baseSize && !isPlain(baseSize.base)) {
    console.error("size.json: expected top-level base");
    process.exit(1);
  }
  if (!isPlain(globals.color)) {
    console.error("globals.json: expected top-level color");
    process.exit(1);
  }

  let mergedColor = { ...globals.color };
  for (const file of walkTokenFiles(componentsDir)) {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    if (isPlain(doc.color)) {
      mergedColor = deepMerge(mergedColor, doc.color);
    }
  }

  let functionalSize = {};
  for (const file of walkJsonFiles(functionalSizeDir)) {
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isPlain(doc)) continue;
    // Merge size tokens into one namespace
    functionalSize = deepMerge(functionalSize, doc);
  }

  const root = {
    base: deepMerge(light.base, baseSize?.base ?? {}),
    color: mergedColor,
    size: functionalSize,
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
  const uBase = uRoot.base;
  const uColor = uRoot.color;
  const uSize = uRoot.size;

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

  const control = uSize?.size?.control;
  const sizesOk =
    isPlain(control) &&
    isPlain(control.small) &&
    isPlain(control.medium) &&
    isPlain(control.large);
  if (!sizesOk) {
    console.error(
      "Expected resolved size.control.{small,medium,large} (from tokens/functional/size/size.json)"
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

  // Map control sizes → ThemeTokens.components.button.{sm,md,lg}
  // Use paddingInline.condensed as the canonical paddingX.
  const buttonSizeBase = {
    sm: {
      height: pick(control.small, "size"),
      paddingX: pick(control.small, "paddingInline.normal"),
      paddingY: pick(control.small, "paddingBlock"),
      iconGap: pick(control.small, "gap"),
    },
    md: {
      height: pick(control.medium, "size"),
      paddingX: pick(control.medium, "paddingInline.condensed"),
      paddingY: pick(control.medium, "paddingBlock"),
      iconGap: pick(control.medium, "gap"),
    },
    lg: {
      height: pick(control.large, "size"),
      paddingX: pick(control.large, "paddingInline.condensed"),
      paddingY: pick(control.large, "paddingBlock"),
      iconGap: pick(control.large, "gap"),
    },
  };

  for (const [k, v] of Object.entries(buttonSizeBase)) {
    for (const field of ["height", "paddingX", "paddingY", "iconGap"]) {
      if (typeof v[field] !== "string") {
        console.error(`Expected buttonSizeBase.${k}.${field} to be a string`);
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

  const payload = {
    base,
    colors: {
      functional: {
        background,
        foreground,
        border,
        syntax,
      },
    },
    sizes: {
      borderRadius,
      borderWidth,
    },
    buttonPrimary,
    buttonSecondary,
    buttonSizeBase,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}

main();
