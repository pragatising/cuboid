import type { SpaceScale } from "../theme/types";

/** 8pt grid spacing token for margin, gap overrides, CSS modules, etc. (`1x` = 8px). */
export type SpaceToken = SpaceScale;

/** Map a spacing scale token to a theme CSS variable reference. */
export function spaceTokenToCssVar(token: SpaceToken): string {
  return `var(--cube-space-${token})`;
}
