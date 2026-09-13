import type { BorderRadiusTokens, GlobalColorPath } from "../../../theme/types";

export type { GlobalColorPath as BoxBackground };
export type { GlobalColorPath as BoxBorderColor };
export type { GlobalColorPath as BoxForeground };

export type BoxBorderRadius = keyof BorderRadiusTokens;

export type BoxOverflow = "visible" | "hidden" | "auto" | "scroll";

/** @deprecated Use `SpaceToken` — alias kept for Box margin props. */
export type { SpaceToken as BoxMargin } from "../../../utils/spaceToken";
