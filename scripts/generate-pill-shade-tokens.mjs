#!/usr/bin/env node
/**
 * Generate pill/<shade>.json from hue config (mirrors gray.json structure).
 * Run after editing PILL_HUE_CONFIG; then `npm run tokens:theme`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../tokens/functional/components/pill");

const token = (value) => ({ value });

/** fg stop keys per intensity (must exist under color.fg.<fgHue> in globals.json). */
const PILL_HUE_CONFIG = {
  yellow: { stops: { extralight: 2, light: 3, bold: 4, extraBold: 5 } },
  green: { stops: { extralight: 2, light: 3, bold: 4, extraBold: 5 } },
  teal: { stops: { extralight: 1, light: 2, bold: 3, extraBold: 5 } },
  orange: { stops: { extralight: 3, light: 3, bold: 4, extraBold: 5 } },
  red: { stops: { extralight: 3, light: 3, bold: 4, extraBold: 5 } },
  blue: { stops: { extralight: 1, light: 2, bold: 3, extraBold: 5 } },
  purple: { stops: { extralight: 2, light: 3, bold: 4, extraBold: 5 } },
  lime: { stops: { extralight: 2, light: 3, bold: 4, extraBold: 5 } },
  indigo: { stops: { extralight: 3, light: 3, bold: 4, extraBold: 5 } },
  /** Pill shade `mag`; fg tokens live under color.fg.magenta, base scale is `mag`. */
  mag: {
    stops: { extralight: 1, light: 2, bold: 3, extraBold: 4 },
    fgHue: "magenta",
    bgHue: "mag",
  },
};

const INTENSITIES = ["extralight", "light", "bold", "extraBold"];

const BG_REST = {
  extralight: ["0", "1", "1", "2"],
  light: ["1", "2", "2", "3"],
  bold: ["2", "3", "3", "4"],
  extraBold: ["11", "10", "10", "11"],
};

const BG_BORDERED_REST = ["01", "01", "02", "01"];
const BG_BORDERED_HOVER = ["02", "02", "03", "02"];
const BG_BORDERED_PRESSED = ["03", "04", "04", "03"];

function fg(fgHue, stop) {
  return `{color.fg.${fgHue}.${stop}}`;
}

function bg(bgHue, stop) {
  return `{base.color.scale.${bgHue}.${stop}}`;
}

function buildIntensity(shade, intensity, entry) {
  const cfg = entry.stops;
  const fgHue = entry.fgHue ?? shade;
  const bgHue = entry.bgHue ?? shade;
  const [bgRest, bgHover, bgPressed, bgDisabled] = BG_REST[intensity];
  const fgRest = cfg[intensity];
  const fgHover = Math.min(fgRest + 1, cfg.extraBold);
  const fgPressed = Math.min(fgRest + 1, cfg.extraBold);
  const borderedIdx = INTENSITIES.indexOf(intensity);

  const filled = {
    bgColor: {
      rest: token(intensity === "extraBold" ? bg(bgHue, bgRest) : bg(bgHue, bgRest)),
      hover: token(bg(bgHue, bgHover)),
      pressed: token(bg(bgHue, bgPressed)),
      disabled: token("{color.bg.gray.light.03}"),
    },
    borderColor: {
      rest: token("{color.canvas.transparent}"),
      hover: token("{color.canvas.transparent}"),
      pressed: token("{color.canvas.transparent}"),
      disabled: token("{color.canvas.transparent}"),
    },
    fgColor: {
      rest: token(
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(fgHue, fgRest)
      ),
      hover: token(
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(fgHue, fgHover)
      ),
      pressed: token(
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(fgHue, fgPressed)
      ),
      disabled: token("{color.fg.neutral.3}"),
    },
  };

  const bordered = {
    bgColor: {
      rest: token(`{color.bg.gray.light.${BG_BORDERED_REST[borderedIdx]}}`),
      hover: token(`{color.bg.gray.light.${BG_BORDERED_HOVER[borderedIdx]}}`),
      pressed: token(`{color.bg.gray.light.${BG_BORDERED_PRESSED[borderedIdx]}}`),
      disabled: token("{color.bg.gray.light.03}"),
    },
    borderColor: {
      rest: token(
        intensity === "extraBold" ? bg(bgHue, "10") : bg(bgHue, String(Number(bgRest) + 3))
      ),
      hover: token(
        intensity === "extraBold" ? bg(bgHue, "11") : bg(bgHue, String(Number(bgRest) + 3))
      ),
      pressed: token(
        intensity === "extraBold" ? bg(bgHue, "11") : bg(bgHue, String(Number(bgRest) + 3))
      ),
      disabled: token("{color.border.gray.1}"),
    },
    fgColor: {
      rest: token(intensity === "extraBold" ? fg(fgHue, cfg.extraBold) : fg(fgHue, fgRest)),
      hover: token(intensity === "extraBold" ? fg(fgHue, cfg.extraBold) : fg(fgHue, fgHover)),
      pressed: token(
        intensity === "extraBold" ? fg(fgHue, Math.max(cfg.extraBold - 1, 3)) : fg(fgHue, fgPressed)
      ),
      disabled: token("{color.fg.neutral.3}"),
    },
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
