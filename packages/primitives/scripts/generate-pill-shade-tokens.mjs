#!/usr/bin/env node
/**
 * Generate pill/<shade>.json5 — static chip/tag colors (no button-style states).
 * Run: node scripts/generate-pill-shade-tokens.mjs && npm run tokens:theme
 *
 * Each surface has bgColor, fgColor, borderColor (single values).
 * Intensity → filled bg on hue scale: extraLight 0, light 2, bold 7, extraBold 9–12.
 *
 * Emits DTCG ($value/$type) referencing the FUNCTIONAL layer only. Components
 * must never reach into base/ — base exists to be aliased by functional tokens,
 * and is `include`-only in the build (resolvable, never emitted), so a
 * {base.*} reference in a component has no CSS variable to point at.
 * Hue steps therefore go through display.<hue>.scale.<n>, the functional
 * alias over base.color.<hue>.<n>.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../src/tokens/components/pill");

const token = (value) => ({
  $value: value,
  $type: "color",
  $extensions: { "org.cuboid.figma": { collection: "component", group: "pill" } },
});

const PILL_HUE_CONFIG = {
  gray: {
    stops: { extraLight: 5, light: 5, bold: 6, extraBold: 6 },
    fgHue: "neutral",
    bgHue: "gray",
    isGray: true,
  },
  yellow: { stops: { extraLight: 2, light: 3, bold: 3, extraBold: 5 } },
  green: { stops: { extraLight: 2, light: 3, bold: 3, extraBold: 5 } },
  teal: { stops: { extraLight: 1, light: 2, bold: 2, extraBold: 5 } },
  orange: { stops: { extraLight: 3, light: 3, bold: 3, extraBold: 5 } },
  red: { stops: { extraLight: 3, light: 3, bold: 3, extraBold: 5 } },
  blue: { stops: { extraLight: 1, light: 2, bold: 2, extraBold: 5 } },
  purple: { stops: { extraLight: 2, light: 3, bold: 3, extraBold: 5 } },
  lime: { stops: { extraLight: 2, light: 3, bold: 3, extraBold: 5 } },
  indigo: { stops: { extraLight: 3, light: 3, bold: 3, extraBold: 5 } },
  mag: {
    stops: { extraLight: 1, light: 2, bold: 2, extraBold: 4 },
    // fgHue was "magenta", which is not a real hue key — the scale is "mag".
    fgHue: "mag",
    bgHue: "mag",
  },
};

const INTENSITIES = ["extraLight", "light", "bold", "extraBold"];

const BG_FILLED = {
  extraLight: "0",
  light: "2",
  bold: "7",
};

const EXTRA_BOLD_BG = {
  gray: "12",
  purple: "9",
  indigo: "10",
  blue: "10",
  green: "10",
  teal: "10",
  orange: "10",
  red: "10",
  yellow: "10",
  lime: "10",
  mag: "10",
};

const BORDER_FILLED = {
  extraLight: "3",
  light: "5",
  bold: "8",
};

const EXTRA_BOLD_BORDER = {
  gray: "10",
  purple: "9",
  indigo: "10",
  blue: "10",
  green: "10",
  teal: "10",
  orange: "10",
  red: "10",
  yellow: "10",
  lime: "10",
  mag: "10",
};

const BG_BORDERED = ["1", "1", "2", "1"];

const NEUTRAL_FG_BY_STOP = {
  4: "subtle",
  5: "default",
  6: "muted",
};

function fgSemantic(fgHue, stop) {
  if (fgHue === "neutral") {
    const key = NEUTRAL_FG_BY_STOP[stop] ?? "default";
    return `{fgColor.neutral.${key}}`;
  }
  const n = Number(stop);
  const role = n <= 3 ? "muted" : "contrast";
  // display.<hue>.fgColor is a single value, not a role map, so the role
  // picks a scale step instead: muted = mid scale, contrast = darkest.
  return `{display.${fgHue}.scale.${role === "muted" ? 7 : 10}}`;
}

function fg(fgHue, stop) {
  return fgSemantic(fgHue, stop);
}

function bg(bgHue, stop) {
  return `{display.${bgHue}.scale.${stop}}`;
}

function filledBgStop(shade, intensity) {
  if (intensity === "extraBold") {
    return EXTRA_BOLD_BG[shade] ?? EXTRA_BOLD_BG.blue;
  }
  return BG_FILLED[intensity];
}

function borderedBorderStop(shade, intensity) {
  if (intensity === "extraBold") {
    return EXTRA_BOLD_BORDER[shade] ?? EXTRA_BOLD_BORDER.blue;
  }
  return BORDER_FILLED[intensity];
}

function buildIntensity(shade, intensity, entry) {
  const cfg = entry.stops;
  const fgHue = entry.fgHue ?? shade;
  const bgHue = entry.bgHue ?? shade;
  const borderedIdx = INTENSITIES.indexOf(intensity);
  const onDarkFilledBg = intensity === "extraBold" || intensity === "bold";
  const fgStop = cfg[intensity];

  const filled = {
    bgColor: token(bg(bgHue, filledBgStop(shade, intensity))),
    borderColor: token("{bgColor.canvas.transparent}"),
    fgColor: token(onDarkFilledBg ? "{fgColor.neutral.inverted}" : fg(fgHue, fgStop)),
  };

  const bordered = {
    bgColor: token(bg("gray", BG_BORDERED[borderedIdx])),
    borderColor: token(
      entry.isGray && intensity !== "extraBold"
        ? "{borderColor.strong}"
        : bg(bgHue, borderedBorderStop(shade, intensity))
    ),
    fgColor: token(
      intensity === "extraBold" ? fg(fgHue, cfg.extraBold) : fg(fgHue, fgStop)
    ),
  };

  return { filled, bordered };
}

function buildHueFile(shade, entry) {
  const shadeBlock = {};
  for (const intensity of INTENSITIES) {
    shadeBlock[intensity] = buildIntensity(shade, intensity, entry);
  }
  return { pill: { color: { [shade]: shadeBlock } } };
}

for (const [shade, entry] of Object.entries(PILL_HUE_CONFIG)) {
  const outPath = path.join(OUT_DIR, `${shade}.json5`);
  fs.writeFileSync(outPath, JSON.stringify(buildHueFile(shade, entry), null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}
