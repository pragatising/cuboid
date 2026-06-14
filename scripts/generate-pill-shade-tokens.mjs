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

/** fg stop keys per intensity (must exist under color.fg.<hue> in globals.json). */
const PILL_HUE_CONFIG = {
  yellow: { extralight: 2, light: 3, bold: 4, extraBold: 5 },
  green: { extralight: 2, light: 3, bold: 4, extraBold: 5 },
  teal: { extralight: 1, light: 2, bold: 3, extraBold: 5 },
  orange: { extralight: 3, light: 3, bold: 4, extraBold: 5 },
  red: { extralight: 3, light: 3, bold: 4, extraBold: 5 },
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

function fg(hue, stop) {
  return `{color.fg.${hue}.${stop}}`;
}

function bg(hue, stop) {
  return `{base.color.scale.${hue}.${stop}}`;
}

function buildIntensity(hue, intensity, cfg) {
  const [bgRest, bgHover, bgPressed, bgDisabled] = BG_REST[intensity];
  const fgRest = cfg[intensity];
  const fgHover = Math.min(fgRest + 1, cfg.extraBold);
  const fgPressed = Math.min(fgRest + 1, cfg.extraBold);
  const borderedIdx = INTENSITIES.indexOf(intensity);

  const filled = {
    bgColor: {
      rest: token(intensity === "extraBold" ? bg(hue, bgRest) : bg(hue, bgRest)),
      hover: token(bg(hue, bgHover)),
      pressed: token(bg(hue, bgPressed)),
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
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(hue, fgRest)
      ),
      hover: token(
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(hue, fgHover)
      ),
      pressed: token(
        intensity === "extraBold" ? "{color.fg.neutral.1}" : fg(hue, fgPressed)
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
        intensity === "extraBold" ? bg(hue, "10") : bg(hue, String(Number(bgRest) + 3))
      ),
      hover: token(
        intensity === "extraBold" ? bg(hue, "11") : bg(hue, String(Number(bgRest) + 3))
      ),
      pressed: token(
        intensity === "extraBold" ? bg(hue, "11") : bg(hue, String(Number(bgRest) + 3))
      ),
      disabled: token("{color.border.gray.1}"),
    },
    fgColor: {
      rest: token(intensity === "extraBold" ? fg(hue, cfg.extraBold) : fg(hue, fgRest)),
      hover: token(intensity === "extraBold" ? fg(hue, cfg.extraBold) : fg(hue, fgHover)),
      pressed: token(
        intensity === "extraBold" ? fg(hue, Math.max(cfg.extraBold - 1, 3)) : fg(hue, fgPressed)
      ),
      disabled: token("{color.fg.neutral.3}"),
    },
  };

  return { filled, bordered };
}

function buildHueFile(hue, cfg) {
  const shade = {};
  for (const intensity of INTENSITIES) {
    shade[intensity] = buildIntensity(hue, intensity, cfg);
  }
  return { pill: { color: { [hue]: shade } } };
}

for (const [hue, cfg] of Object.entries(PILL_HUE_CONFIG)) {
  const outPath = path.join(OUT_DIR, `${hue}.json`);
  fs.writeFileSync(outPath, JSON.stringify(buildHueFile(hue, cfg), null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}
