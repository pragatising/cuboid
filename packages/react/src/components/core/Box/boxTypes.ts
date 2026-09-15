import type { BorderRadiusTokens, GlobalColorPath } from "../../../theme/types";

export type { GlobalColorPath as BoxBackground };
export type { GlobalColorPath as BoxBorderColor };
export type { GlobalColorPath as BoxForeground };

export type BoxBorderRadius = keyof BorderRadiusTokens;

/** Shared value set for `overflow` / `overflowX` / `overflowY`. */
export type BoxOverflowAxis = "visible" | "hidden" | "auto" | "scroll";
