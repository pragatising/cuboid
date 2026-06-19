#!/usr/bin/env node
/**
 * Convert the raw typography export (px, Figma-ish structure) into a theme-shaped
 * typography token file that `scripts/build-theme.mjs` can merge + unwrap.
 *
 * Input:  tokens/functional/typography/typography.json
 * Output: tokens/functional/typography/theme.tokens.json
 *
 * px → rem uses a 16px base by default (override with TYPOGRAPHY_BASE_PX).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const INPUT = path.join(ROOT, "tokens/functional/typography/typography.json");
const OUTPUT = path.join(ROOT, "tokens/functional/typography/theme.tokens.json");

const BASE_PX = Number(process.env.TYPOGRAPHY_BASE_PX ?? 16);
if (!Number.isFinite(BASE_PX) || BASE_PX <= 0) {
  console.error(`Invalid TYPOGRAPHY_BASE_PX: ${process.env.TYPOGRAPHY_BASE_PX}`);
  process.exit(1);
}

const isPlain = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

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

function ensureQuotedFamily(name) {
  if (typeof name !== "string" || !name.trim()) return undefined;
  const trimmed = name.trim();
  if (trimmed.includes(" ") || trimmed.includes("-")) {
    // keep already quoted names, otherwise wrap in single quotes
    if (trimmed.startsWith("'") || trimmed.startsWith("\"")) return trimmed;
    return `'${trimmed}'`;
  }
  return `'${trimmed}'`;
}

function token(v) {
  return { value: v };
}

function lineHeightRatio(fontPx, lhPx, fallback) {
  if (Number.isFinite(fontPx) && Number.isFinite(lhPx) && fontPx > 0) {
    return Math.round((lhPx / fontPx) * 10000) / 10000;
  }
  return fallback;
}

function subheadTextRole(raw, sizePath, lineHeightPath, weight, lineHeightFallback) {
  const sizePx = leafValue(get(raw, sizePath));
  const lhPx = leafValue(get(raw, lineHeightPath));
  return {
    fontSize: token(pxToRem(sizePx) ?? "0.875rem"),
    fontWeight: token(weight),
    lineHeight: token(lineHeightRatio(sizePx, lhPx, lineHeightFallback)),
  };
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Missing input: ${INPUT}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT, "utf8"));

  const systemStack = leafValue(get(raw, "fontStack.system"));
  const sans = leafValue(get(raw, "fontStack.sansSerif"));
  const mono = leafValue(get(raw, "fontStack.monospace"));

  const baseFamily =
    typeof sans === "string" && typeof systemStack === "string"
      ? `${ensureQuotedFamily(sans)}, ${systemStack}`
      : typeof systemStack === "string"
        ? systemStack
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

  const monoFamily =
    typeof mono === "string"
      ? mono
      : "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace";

  const sizeXsPx = leafValue(get(raw, "text.sizes.xs"));
  const sizeSmPx = leafValue(get(raw, "text.sizes.sm"));
  const sizeMdPx = leafValue(get(raw, "text.sizes.md"));
  const sizeLgPx = leafValue(get(raw, "text.sizes.lg"));
  const sizeXlPx = leafValue(get(raw, "text.sizes.xl"));

  // Map raw sizes to theme scale.
  const fontSize = {
    xs: token(pxToRem(sizeXsPx) ?? "0.75rem"),
    sm: token(pxToRem(sizeSmPx) ?? "0.875rem"),
    md: token(pxToRem(sizeMdPx) ?? "1rem"),
    lg: token(pxToRem(sizeLgPx) ?? "1.25rem"),
    xl: token(pxToRem(sizeXlPx) ?? "1.5rem"),
    xxl: token(pxToRem(sizeXlPx) ?? "2rem"),
  };

  const weightRegular = leafValue(get(raw, "text.weight.400"));
  const weightMedium = leafValue(get(raw, "text.weight.500"));
  const weightSemibold = leafValue(get(raw, "text.weight.600"));
  const weightBold = leafValue(get(raw, "text.weight.700"));

  const fontWeight = {
    regular: token(Number.isFinite(weightRegular) ? weightRegular : 400),
    medium: token(Number.isFinite(weightMedium) ? weightMedium : 500),
    semibold: token(Number.isFinite(weightSemibold) ? weightSemibold : 600),
    bold: token(Number.isFinite(weightBold) ? weightBold : 700),
  };

  const lineHeight = {
    tight: token(1.25),
    normal: token(1.5),
    relaxed: token(1.75),
  };

  const subheadWeightSemibold =
    leafValue(get(raw, "text.subhead.weight.600")) ?? fontWeight.semibold.value;

  const theme = {
    typography: {
      fontFamily: {
        base: token(baseFamily),
        mono: token(monoFamily),
      },
      fontSize,
      fontWeight,
      lineHeight,
      text: {
        display: {
          fontSize: token(fontSize.xxl.value),
          fontWeight: token(fontWeight.semibold.value),
          lineHeight: token(lineHeight.tight.value),
        },
        titleLarge: {
          fontSize: token(fontSize.xl.value),
          fontWeight: token(fontWeight.semibold.value),
          lineHeight: token(lineHeight.tight.value),
        },
        titleMedium: {
          fontSize: token(fontSize.md.value),
          fontWeight: token(fontWeight.semibold.value),
          lineHeight: token(lineHeight.tight.value),
        },
        titleSmall: {
          fontSize: token(fontSize.sm.value),
          fontWeight: token(fontWeight.semibold.value),
          lineHeight: token(lineHeight.normal.value),
        },
        subtitle: {
          fontSize: token(fontSize.md.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.normal.value),
        },
        subheadXs: subheadTextRole(
          raw,
          "text.subhead.size.xs",
          "text.subhead.lineHeight.12",
          subheadWeightSemibold,
          lineHeight.tight.value
        ),
        subheadSm: subheadTextRole(
          raw,
          "text.subhead.size.sm",
          "text.subhead.lineHeight.16",
          subheadWeightSemibold,
          lineHeight.normal.value
        ),
        subheadMd: subheadTextRole(
          raw,
          "text.subhead.size.md",
          "text.subhead.lineHeight.20",
          subheadWeightSemibold,
          lineHeight.normal.value
        ),
        bodyLarge: {
          fontSize: token(fontSize.md.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.relaxed.value),
        },
        bodyMedium: {
          fontSize: token(fontSize.sm.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.normal.value),
        },
        bodyStrong: {
          fontSize: token(fontSize.sm.value),
          fontWeight: token(fontWeight.semibold.value),
          lineHeight: token(lineHeight.normal.value),
        },
        bodySmall: {
          fontSize: token(fontSize.xs.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.normal.value),
        },
        caption: {
          fontSize: token(fontSize.xs.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.tight.value),
        },
        codeBlock: {
          fontSize: token(fontSize.xs.value),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.tight.value),
          fontFamily: token(monoFamily),
        },
        inlineCode: {
          fontSize: token("0.875em"),
          fontWeight: token(fontWeight.regular.value),
          lineHeight: token(lineHeight.normal.value),
          fontFamily: token(monoFamily),
        },
      },
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(theme, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main();

