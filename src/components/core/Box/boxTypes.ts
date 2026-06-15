import type { BackgroundColors, BorderRadiusTokens, ForegroundColors } from "../../../theme/types";

export type BoxBackground =
  | Exclude<keyof BackgroundColors, "neutral">
  | "neutralMuted"
  | "neutralEmphasis";

export type BoxBorder = "none" | "default" | "muted";

export type BoxBorderRadius = keyof BorderRadiusTokens;

export type BoxForeground = keyof ForegroundColors;

export type BoxOverflow = "visible" | "hidden" | "auto" | "scroll";
