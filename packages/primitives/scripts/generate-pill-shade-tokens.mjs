#!/usr/bin/env node
/**
 * Generate pill/<shade>.json — static chip/tag colors (no button-style states).
 * Run: node scripts/generate-pill-shade-tokens.mjs && npm run tokens:theme
 *
 * Each surface has bgColor, fgColor, borderColor (single values).
 * Intensity → filled bg on hue scale: extralight 0, light 2, bold 7, extraBold 9–12.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../tokens/functional/components/pill");

const token = (value) => ({ value });

const PILL_HUE_CONFIG = {
  gray: {
    stops: { extralight: 5, light: 5, bold: 6, extraBold: 6 },
    fgHue: "neutral",
    bgHue: "gray",
    isGray: true,
  },
  yellow: { stops: { extralight: 2, light: 3, bold: 3, extraBold: 5 } },
  green: { stops: { extralight: 2, light: 3, bold: 3, extraBold: 5 } },
  teal: { stops: { extralight: 1, light: 2, bold: 2, extraBold: 5 } },
  orange: { stops: { extralight: 3, light: 3, bold: 3, extraBold: 5 } },
  red: { stops: { extralight: 3, light: 3, bold: 3, extraBold: 5 } },
  blue: { stops: { extralight: 1, light: 2, bold: 2, extraBold: 5 } },
  purple: { stops: { extralight: 2, light: 3, bold: 3, extraBold: 5 } },
  lime: { stops: { extralight: 2, light: 3, bold: 3, extraBold: 5 } },
  indigo: { stops: { extralight: 3, light: 3, bold: 3, extraBold: 5 } },
  mag: {
    stops: { extralight: 1, light: 2, bold: 2, extraBold: 4 },
    fgHue: "magenta",
    bgHue: "mag",
  },
};

const INTENSITIES = ["extralight", "light", "bold", "extraBold"];

const BG_FILLED = {
  extralight: "0",
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
  extralight: "3",
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
    return `{color.fg.neutral.${key}}`;
  }
  const n = Number(stop);
  const role = n <= 3 ? "muted" : "contrast";
  return `{color.fg.${fgHue}.${role}}`;
}

function fg(fgHue, stop) {
  return fgSemantic(fgHue, stop);
}

function bg(bgHue, stop) {
  return `{base.color.scale.${bgHue}.${stop}}`;
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
    borderColor: token("{color.canvas.transparent}"),
    fgColor: token(onDarkFilledBg ? "{color.fg.neutral.inverted}" : fg(fgHue, fgStop)),
  };

  const bordered = {
    bgColor: token(bg("gray", BG_BORDERED[borderedIdx])),
    borderColor: token(
      entry.isGray && intensity !== "extraBold"
        ? "{color.border.gray.3}"
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
  const outPath = path.join(OUT_DIR, `${shade}.json`);
  fs.writeFileSync(outPath, JSON.stringify(buildHueFile(shade, entry), null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}
