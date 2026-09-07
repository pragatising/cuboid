#!/usr/bin/env node
/**
 * Build theme-shaped typography tokens (in-memory) for `scripts/build-theme.mjs`.
 *
 * Input: tokens/functional/typography/typography.json — Figma primitives (px)
 *
 * Text styles are inferred from typography.json:
 *   - heading + size → text.sizes.{size} + heading.weight.* + heading.lineHeight[fontPx]
 *   - body + size    → text.sizes.{size} + text.weight.* + text.lineHeight[fontPx]
 *   - subhead + step → text.subhead.*
 *   - code           → mono stack + xs / 0.875em
 *
 * px → rem uses a 16px base (override with TYPOGRAPHY_BASE_PX).
 *
 * `buildTypographyTheme(raw)` is imported directly by build-theme.mjs — no
 * intermediate file is written to tokens/ anymore (that dir is otherwise
 * 100% hand-authored source; a generated sibling there was a standing
 * duplicate of what ends up in src/theme/output/theme.json). Run this file
 * directly (`node scripts/build-typography-theme.mjs`) to print the same
 * theme-shaped JSON to stdout for inspection.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const TYPOGRAPHY_INPUT = path.join(ROOT, "tokens/functional/typography/typography.json");

const WEIGHT_SEMANTIC = {
  "400": "regular",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
};

const BASE_PX = Number(process.env.TYPOGRAPHY_BASE_PX ?? 16);
if (!Number.isFinite(BASE_PX) || BASE_PX <= 0) {
  console.error(`Invalid TYPOGRAPHY_BASE_PX: ${process.env.TYPOGRAPHY_BASE_PX}`);
  process.exit(1);
}

const isPlain = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

function fail(message) {
  console.error(`build-typography-theme: ${message}`);
  process.exit(1);
}

function get(obj, p) {
  const parts = p.split(".");
  let cur = obj;
  for (const part of parts) {
    if (!isPlain(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function leafValue(obj) {
  if (!isPlain(obj) || !("value" in obj)) return undefined;
  return obj.value;
}

function pxToRem(px) {
  const n = typeof px === "string" ? Number(px) : px;
  if (!Number.isFinite(n)) return undefined;
  const rem = n / BASE_PX;
  const rounded = Math.round(rem * 10000) / 10000;
  return `${rounded}rem`;
}

function capitalize(size) {
  return size.charAt(0).toUpperCase() + size.slice(1);
}

function ensureQuotedFamily(name) {
  if (typeof name !== "string" || !name.trim()) return undefined;
  const trimmed = name.trim();
  if (trimmed.includes(" ") || trimmed.includes("-")) {
    if (trimmed.startsWith("'") || trimmed.startsWith("\"")) return trimmed;
    return `'${trimmed}'`;
  }
  return `'${trimmed}'`;
}

function token(v) {
  return { value: v };
}

function lineHeightRatio(fontPx, lhPx, fallback = 1.5) {
  if (Number.isFinite(fontPx) && Number.isFinite(lhPx) && fontPx > 0) {
    return Math.round((lhPx / fontPx) * 10000) / 10000;
  }
  return fallback;
}

function resolveRef(raw, refPath, label) {
  const value = leafValue(get(raw, refPath));
  if (value === undefined) fail(`Missing ${label} at typography.json → ${refPath}`);
  return value;
}

/** Line-height px from typography.json — keys are font size px, values are line height px. */
function mapLineHeightPx(lhTable, fontSizePx, label) {
  if (!isPlain(lhTable)) fail(`Missing ${label} table`);

  const key = String(fontSizePx);
  const lhPx = leafValue(lhTable[key]);
  if (!Number.isFinite(lhPx)) {
    fail(`Missing ${label}.${key} for ${fontSizePx}px font (add "font px → line height px" entry)`);
  }
  return lhPx;
}

function buildFontSizeScale(raw) {
  const sizes = get(raw, "text.sizes");
  if (!isPlain(sizes)) fail("typography.json is missing text.sizes");

  const fontSize = {};
  for (const [key, node] of Object.entries(sizes)) {
    const px = leafValue(node);
    const rem = pxToRem(px);
    if (!rem) fail(`Invalid px for text.sizes.${key}: ${px}`);
    fontSize[key] = token(rem);
  }

  if (fontSize.xl) fontSize.xxl = token(fontSize.xl.value);

  return fontSize;
}

function buildFontWeightScale(raw) {
  const weights = get(raw, "text.weight");
  if (!isPlain(weights)) fail("typography.json is missing text.weight");

  const fontWeight = {};
  for (const [key, node] of Object.entries(weights)) {
    const value = leafValue(node);
    if (!Number.isFinite(value)) fail(`Invalid weight for text.weight.${key}: ${value}`);
    fontWeight[WEIGHT_SEMANTIC[key] ?? key] = token(value);
  }

  return fontWeight;
}

function buildRoleSizeStyle(raw, role, sizeKey, families) {
  const fontSizePx = resolveRef(raw, `text.sizes.${sizeKey}`, `${role}.${sizeKey}.fontSize`);
  const rem = pxToRem(fontSizePx);
  if (!rem) fail(`Could not convert text.sizes.${sizeKey} (${fontSizePx}px) to rem`);

  if (role === "heading") {
    const fontWeight = resolveRef(raw, "heading.weight.600", `${role}.${sizeKey}.fontWeight`);
    const lhPx = mapLineHeightPx(
      get(raw, "heading.lineHeight"),
      fontSizePx,
      `heading.lineHeight for ${role}.${sizeKey}`,
    );

    return {
      fontSize: token(rem),
      fontWeight: token(fontWeight),
      lineHeight: token(lineHeightRatio(fontSizePx, lhPx, 1.25)),
    };
  }

  if (role === "body") {
    const fontWeight = resolveRef(raw, "text.weight.400", `${role}.${sizeKey}.fontWeight`);
    const lhPx = mapLineHeightPx(
      get(raw, "text.lineHeight"),
      fontSizePx,
      `text.lineHeight for ${role}.${sizeKey}`,
    );

    return {
      fontSize: token(rem),
      fontWeight: token(fontWeight),
      lineHeight: token(lineHeightRatio(fontSizePx, lhPx, 1.5)),
    };
  }

  fail(`Unknown role "${role}"`);
}

function buildSubheadStyle(raw, step) {
  const sizePath = `text.subhead.size.${step}`;
  const weightPath = "text.subhead.weight.600";

  const fontSizePx = resolveRef(raw, sizePath, `subhead.${step}.fontSize`);
  const rem = pxToRem(fontSizePx);
  if (!rem) fail(`Could not convert ${sizePath} to rem`);

  const fontWeight = resolveRef(raw, weightPath, `subhead.${step}.fontWeight`);
  const lhPx = mapLineHeightPx(
    get(raw, "text.subhead.lineHeight"),
    fontSizePx,
    `text.subhead.lineHeight for subhead.${step}`,
  );

  return {
    fontSize: token(rem),
    fontWeight: token(fontWeight),
    lineHeight: token(lineHeightRatio(fontSizePx, lhPx, 1.5)),
  };
}

function buildTextTokens(raw, families) {
  const sizes = Object.keys(get(raw, "text.sizes") ?? {});
  if (!sizes.length) fail("typography.json text.sizes is empty");

  const text = {};

  for (const size of sizes) {
    text[`heading${capitalize(size)}`] = buildRoleSizeStyle(raw, "heading", size, families);
    text[`body${capitalize(size)}`] = buildRoleSizeStyle(raw, "body", size, families);
  }

  for (const step of ["xs", "sm", "md"]) {
    text[`subhead${capitalize(step)}`] = buildSubheadStyle(raw, step);
  }

  // codeBlock has its own authored entry (raw.codeBlock) — same pattern as
  // `button` — rather than borrowing text.sizes.xs / text.weight.400, which
  // made codeBlock's fontSize/fontWeight silently track unrelated generic
  // body-text values instead of a real per-component decision.
  const rawCodeBlock = get(raw, "codeBlock");
  const codeBlockFontPx = leafValue(rawCodeBlock?.fontSize);
  const codeBlockLineHeightPx = leafValue(rawCodeBlock?.lineHeight);
  const codeBlockWeight = leafValue(rawCodeBlock?.weight);
  if (
    !Number.isFinite(codeBlockFontPx) ||
    !Number.isFinite(codeBlockLineHeightPx) ||
    !Number.isFinite(codeBlockWeight)
  ) {
    fail("typography.json is missing codeBlock.{fontSize,lineHeight,weight}");
  }
  text.codeBlock = {
    fontSize: token(pxToRem(codeBlockFontPx)),
    fontWeight: token(codeBlockWeight),
    lineHeight: token(lineHeightRatio(codeBlockFontPx, codeBlockLineHeightPx, 1.25)),
    fontFamily: token(families.mono),
  };

  text.inlineCode = {
    fontSize: token("0.875em"),
    fontWeight: token(resolveRef(raw, "text.weight.400", "inlineCode.fontWeight")),
    lineHeight: token(1.5),
    fontFamily: token(families.mono),
  };

  return text;
}

/** Pure transform: raw typography.json content in, theme-shaped `{ typography: {...} }` out. */
export function buildTypographyTheme(raw) {
  const systemStack = leafValue(get(raw, "fontStack.system"));
  const sans = leafValue(get(raw, "fontStack.sansSerif"));
  const mono = leafValue(get(raw, "fontStack.monospace"));

  const families = {
    base:
      typeof sans === "string" && typeof systemStack === "string"
        ? `${ensureQuotedFamily(sans)}, ${systemStack}`
        : typeof systemStack === "string"
          ? systemStack
          : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    mono:
      typeof mono === "string"
        ? mono
        : "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
  };

  const theme = {
    typography: {
      fontFamily: {
        base: token(families.base),
        mono: token(families.mono),
      },
      fontSize: buildFontSizeScale(raw),
      fontWeight: buildFontWeightScale(raw),
      lineHeight: {
        tight: token(1.25),
        normal: token(1.5),
        relaxed: token(1.75),
      },
      text: buildTextTokens(raw, families),
    },
  };

  return theme;
}

function main() {
  if (!fs.existsSync(TYPOGRAPHY_INPUT)) fail(`Missing ${TYPOGRAPHY_INPUT}`);
  const raw = JSON.parse(fs.readFileSync(TYPOGRAPHY_INPUT, "utf8"));
  const theme = buildTypographyTheme(raw);
  console.log(JSON.stringify(theme, null, 2));
}

// Only run the CLI entry when invoked directly (`node scripts/build-typography-theme.mjs`),
// not when imported by build-theme.mjs.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
